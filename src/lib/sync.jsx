// ============================================================
// Store ⇄ backend sync.
//
// Two jobs, both no-ops when Supabase isn't configured:
//   1. useBackendSync — on boot, pull the shared world into the store
//      (session, my profile, everyone's active listings, my saves/follows/
//      threads/notifications) and keep it live via realtime.
//   2. mirror — after the reducer has applied an action locally (optimistic),
//      replay it against the backend. Ids are assigned BEFORE dispatch so the
//      local row and the remote row are the same object.
//
// The reducer stays the single source of truth for what's on screen; the
// backend is where it becomes shared and durable.
// ============================================================
import { useEffect, useRef } from 'react';
import * as api from './backend.js';
import { isConfigured } from './supabase.js';
import { registerProfiles } from '../data/users.js';

const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// Actions whose generated id must be known up front so it can be mirrored.
export function assignIds(action) {
  if (action.type === 'START_CONVERSATION' && !action.id) return { ...action, id: uid('c') };
  if (action.type === 'SEND_MESSAGE' && !action.id) return { ...action, id: uid('m') };
  if (action.type === 'ADD_NOTIFICATION' && !action.notification?.id) {
    return { ...action, notification: { ...action.notification, id: uid('n') } };
  }
  return action;
}

// Replay a locally-applied action against the backend. `prev` is the state
// BEFORE the action (so toggles know which way they went); `next` is after.
// Failures surface through onError (a toast) — the optimistic UI stays, the
// next hydrate reconciles.
export async function mirror(action, prev, next, onError) {
  if (!isConfigured || action.local) return;
  const me = next.auth?.user?.id || prev.auth?.user?.id;
  const authed = next.auth?.status === 'authed' || prev.auth?.status === 'authed';
  const fail = (r, what) => { if (r?.error) onError?.(`${what} didn't save: ${r.error}`); };

  try {
    await api.ensureClient();
    switch (action.type) {
      case 'TOGGLE_SAVE': {
        if (!authed) return;
        const on = next.saved.includes(action.id);
        fail(await api.setSaved(me, action.id, on), 'Save');
        return;
      }
      case 'FOLLOW': {
        if (!authed) return;
        const on = next.following.includes(action.id);
        fail(await api.setFollow(me, action.id, on), 'Follow');
        return;
      }
      case 'PUBLISH': {
        if (!authed) return;
        const listing = next.myListings.find((l) => l.id === action.listing.id) || action.listing;
        fail(await api.publishListing(listing, me), 'Your listing');
        return;
      }
      case 'UPDATE_LISTING': {
        if (!authed) return;
        fail(await api.updateListing(action.id, action.patch, me), 'Your changes');
        return;
      }
      case 'DELETE_LISTING':
        if (authed) fail(await api.deleteListing(action.id), 'Delete');
        return;
      case 'UPGRADE_LISTING': {
        const l = next.myListings.find((x) => x.id === action.id);
        if (l) fail(await api.patchListing(action.id, { listing_plan: l.listingPlan, premium: !!l.premium, sponsored: !!l.sponsored }), 'Upgrade');
        return;
      }
      case 'BOOST_LISTING': {
        const l = next.myListings.find((x) => x.id === action.id);
        if (l) fail(await api.patchListing(action.id, { boosted_until: new Date(l.boostedUntil).toISOString(), boost_id: l.boostId }), 'Boost');
        return;
      }
      case 'VIEW': {
        // once per recent window, and never your own listing
        const fresh = !prev.recent.includes(action.id);
        const own = next.myListings.some((l) => l.id === action.id);
        if (fresh && !own) await api.bumpView(action.id);
        return;
      }
      case 'START_CONVERSATION': {
        if (!authed) return;
        const r = await api.startConversation({ id: action.id, listingId: action.listingId, sellerId: action.sellerId, buyerId: me });
        fail(r, 'Conversation');
        return;
      }
      case 'SEND_MESSAGE': {
        if (!authed) return;
        fail(await api.sendMessage({ id: action.id, convId: action.convId, senderId: me, text: action.text, kind: action.msgType || 'text' }), 'Message');
        return;
      }
      case 'READ_CONVERSATION':
        if (authed) await api.markConversationRead(action.convId, me);
        return;
      case 'READ_NOTIFICATION':
        if (authed) await api.markNotificationRead(action.id);
        return;
      case 'READ_ALL_NOTIFICATIONS':
        if (authed) await api.markAllNotificationsRead(me);
        return;
      case 'UPDATE_PROFILE':
        if (authed) fail(await api.updateMyProfile(me, action.patch), 'Profile');
        return;
      case 'VERIFY_PHONE':
        if (authed) fail(await api.updateMyProfile(me, { phone: action.phone, phoneVerified: true, verified: next.auth.user.verified }), 'Phone');
        return;
      case 'REPORT_LISTING':
        if (authed) fail(await api.reportListing(action.id, me, action.reason), 'Report');
        return;
      case 'SIGN_OUT':
        await api.signOut();
        return;
      default:
        return;
    }
  } catch (e) {
    onError?.(`Couldn't reach Kaira's servers (${e?.message || 'network'}). Changes are kept on this device.`);
  }
}

// Pull everything for a signed-in user. One round of parallel requests.
export async function loadUser(authUser, dispatch) {
  const me = authUser.id;
  const [profile, saves, follows, convs, notifs, mine] = await Promise.all([
    api.fetchProfile(me),
    api.fetchMySaves(me),
    api.fetchMyFollows(me),
    api.fetchMyConversations(me),
    api.fetchMyNotifications(me),
    api.fetchMyListings(me),
  ]);
  const user = profile || api.rowToProfile(null, authUser);
  registerProfiles([user]);
  dispatch({
    type: 'HYDRATE_USER', local: true,
    user, saved: saves, following: follows, conversations: convs, notifications: notifs,
    myListings: mine.map((l) => ({ ...l, mine: true })),
  });
  // Faces for the people in my threads and the sellers I follow.
  const others = [...new Set([...convs.map((c) => c.otherId), ...follows])];
  if (others.length) {
    const profiles = await api.fetchProfiles(others);
    registerProfiles(profiles);
    dispatch({ type: 'SET_PROFILES', local: true, profiles });
  }
}

export function useBackendSync(state, dispatch, onError) {
  const stateRef = useRef(state);
  stateRef.current = state;
  const me = state.auth?.status === 'authed' ? state.auth.user?.id : null;

  // Boot: session + the public feed. A stale local "signed in" from before
  // Phase 1 is not a session — drop to guest unless Supabase says otherwise.
  useEffect(() => {
    if (!isConfigured) return undefined;
    let alive = true;
    let offAuth = () => {};
    let offFeed = () => {};
    (async () => {
      try {
        await api.ensureClient(); // loads the supabase-js chunk only now
        if (!alive) return;
        offAuth = api.onAuthChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            if (stateRef.current.auth.user?.id !== session.user.id) await loadUser(session.user, dispatch);
          } else if (event === 'SIGNED_OUT') {
            dispatch({ type: 'SIGN_OUT', local: true });
          } else if (event === 'PASSWORD_RECOVERY') {
            dispatch({ type: 'SET_RECOVERY', local: true, value: true });
          } else if (event === 'USER_UPDATED' && session?.user) {
            const profile = await api.fetchProfile(session.user.id);
            if (profile) dispatch({ type: 'UPDATE_PROFILE', local: true, patch: profile });
          }
        });
        offFeed = api.subscribeListings({
          onUpsert: (l) => dispatch({ type: 'UPSERT_REMOTE_LISTING', local: true, listing: l }),
          onRemove: (id) => dispatch({ type: 'REMOVE_REMOTE_LISTING', local: true, id }),
        });
        const session = await api.getSession();
        if (!alive) return;
        if (session?.user) await loadUser(session.user, dispatch);
        else if (stateRef.current.auth.status === 'authed') dispatch({ type: 'SIGN_OUT', local: true });
        const { listings, error } = await api.fetchActiveListings();
        if (!alive) return;
        if (error) onError?.(`Couldn't load listings: ${error}`);
        else {
          dispatch({ type: 'SET_REMOTE_LISTINGS', local: true, listings });
          const sellers = [...new Set(listings.map((l) => l.sellerId))];
          if (sellers.length) {
            const profiles = await api.fetchProfiles(sellers);
            registerProfiles(profiles);
            dispatch({ type: 'SET_PROFILES', local: true, profiles });
          }
        }
      } catch (e) {
        onError?.(`Kaira's servers are unreachable right now (${e?.message || 'network'}).`);
      }
    })();
    return () => { alive = false; offAuth(); offFeed(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inbox: live messages, new threads and notifications for whoever is signed in.
  useEffect(() => {
    if (!isConfigured || !me) return undefined;
    let off = () => {};
    let alive = true;
    api.ensureClient().then(() => {
      if (!alive) return;
      off = api.subscribeInbox(me, {
      onMessage: async (message, convId) => {
        const known = stateRef.current.conversations.some((c) => c.id === convId);
        if (!known) {
          // a buyer opened a thread with me and wrote before we saw it
          const convs = await api.fetchMyConversations(me);
          dispatch({ type: 'SET_CONVERSATIONS', local: true, conversations: convs });
          registerProfiles(await api.fetchProfiles(convs.map((c) => c.otherId)));
          return;
        }
        dispatch({ type: 'RECEIVE_MESSAGE', local: true, convId, message });
      },
      onConversation: async (conv) => {
        dispatch({ type: 'ADD_CONVERSATION', local: true, conversation: conv });
        const [p] = await api.fetchProfiles([conv.otherId]);
        if (p) { registerProfiles([p]); dispatch({ type: 'SET_PROFILES', local: true, profiles: [p] }); }
      },
      onNotification: (n) => dispatch({ type: 'ADD_NOTIFICATION', local: true, notification: n }),
      });
    });
    return () => { alive = false; off(); };
  }, [me, dispatch]);
}
