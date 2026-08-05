import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { LISTINGS } from '../data/listings.js';
import { CURRENT_USER } from '../data/users.js';

// ============================================================
// Kaira client store — the app's local "backend".
// Persists to localStorage; seeds realistic conversations & notifications.
// ============================================================

const KEY = 'kaira.state.v1';
const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function initialTheme() {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr) return attr;
  }
  return 'light';
}

function seedConversations() {
  const now = Date.now();
  const m = (from, text, minsAgo, type = 'text') => ({
    id: uid('m'),
    from,
    text,
    type,
    at: new Date(now - minsAgo * 60000).toISOString(),
  });
  return [
    {
      id: 'c_seed_rolex',
      sellerId: 'u_marte',
      listingId: 'l_rolex',
      unread: 1,
      typing: false,
      messages: [
        m('me', 'Hi Marte — is the Submariner still available?', 190),
        m('them', 'Hi! Yes it is, full set with the 2022 card 🙂', 176),
        m('them', 'Happy to meet at a jeweller for authentication if that helps.', 175),
        m('me', 'Perfect. Would you take 170k?', 60),
        m('them', 'Let me think — can do 174k and I’ll include a service.', 4),
      ],
    },
    {
      id: 'c_seed_sofa',
      sellerId: 'u_astrid',
      listingId: 'l_sofa',
      unread: 0,
      typing: false,
      messages: [
        m('me', 'Is the Fogia sofa still up? Love the bouclé.', 1440),
        m('them', 'It is! Barely used. Pickup in Frogner works best.', 1430),
        m('me', 'Great, could do this weekend. I’ll bring a van.', 1400),
        m('them', 'Saturday afternoon is perfect. See you then!', 1390),
      ],
    },
    {
      id: 'c_seed_macbook',
      sellerId: 'u_henrik',
      listingId: 'l_macbook',
      unread: 0,
      typing: false,
      messages: [
        m('me', 'What’s the cycle count on the MacBook?', 3000),
        m('them', '38 cycles — basically new. Original box included.', 2980),
      ],
    },
  ];
}

function seedNotifications() {
  const now = Date.now();
  const n = (type, title, body, minsAgo, meta = {}) => ({
    id: uid('n'),
    type,
    title,
    body,
    read: false,
    at: new Date(now - minsAgo * 60000).toISOString(),
    meta,
  });
  return [
    n('message', 'New message from Marte', 'Let me think — can do 174k…', 4, { convId: 'c_seed_rolex' }),
    n('price', 'Price drop', 'Tesla Model Y is now K1,050,000 (−K30,000)', 300, { listingId: 'l_tesla_y' }),
    n('search', 'New match for “road bike”', 'Canyon Ultimate CF SLX just listed in Stavanger', 540, { listingId: 'l_roadbike' }),
    n('favorite', 'Someone saved your item', 'Your listing was added to 3 favorites today', 720, {}),
    n('system', 'Welcome to Kaira', 'Your account is ready. Complete your profile to build trust.', 1440, {}),
  ];
}

const initialState = {
  theme: initialTheme(),
  auth: { status: 'guest', user: null },
  plan: 'free',
  saved: [],
  recent: [],
  savedSearches: [],
  following: [],
  drafts: [],
  myListings: [],
  conversations: seedConversations(),
  notifications: seedNotifications(),
  onboarded: false,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...initialState };
    const saved = JSON.parse(raw);
    // Always refresh theme from the DOM attribute set pre-paint.
    return { ...initialState, ...saved, theme: initialTheme() };
  } catch {
    return { ...initialState };
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };

    case 'SIGN_IN':
      return {
        ...state,
        auth: { status: 'authed', user: action.user ?? CURRENT_USER },
        onboarded: true,
      };
    case 'SIGN_OUT':
      return { ...state, auth: { status: 'guest', user: null } };

    case 'SET_PLAN':
      return { ...state, plan: action.plan };

    case 'TOGGLE_SAVE': {
      const has = state.saved.includes(action.id);
      return {
        ...state,
        saved: has ? state.saved.filter((x) => x !== action.id) : [action.id, ...state.saved],
      };
    }

    case 'VIEW': {
      const recent = [action.id, ...state.recent.filter((x) => x !== action.id)].slice(0, 12);
      return { ...state, recent };
    }

    case 'SAVE_SEARCH': {
      if (state.savedSearches.some((s) => s.label === action.search.label)) return state;
      return {
        ...state,
        savedSearches: [{ id: uid('s'), ...action.search }, ...state.savedSearches],
      };
    }
    case 'REMOVE_SEARCH':
      return { ...state, savedSearches: state.savedSearches.filter((s) => s.id !== action.id) };

    case 'FOLLOW': {
      const has = state.following.includes(action.id);
      return {
        ...state,
        following: has ? state.following.filter((x) => x !== action.id) : [action.id, ...state.following],
      };
    }

    case 'SAVE_DRAFT': {
      const draft = { ...action.listing, id: action.listing.id || uid('draft'), draft: true };
      const exists = state.drafts.some((d) => d.id === draft.id);
      return {
        ...state,
        drafts: exists ? state.drafts.map((d) => (d.id === draft.id ? draft : d)) : [draft, ...state.drafts],
      };
    }
    case 'DELETE_DRAFT':
      return { ...state, drafts: state.drafts.filter((d) => d.id !== action.id) };

    case 'PUBLISH': {
      const listing = {
        ...action.listing,
        id: action.listing.id?.startsWith('l_') ? action.listing.id : uid('l'),
        sellerId: CURRENT_USER.id,
        postedAt: new Date().toISOString(),
        mine: true,
        views: 0,
        saves: 0,
      };
      return {
        ...state,
        myListings: [listing, ...state.myListings],
        drafts: state.drafts.filter((d) => d.id !== action.listing.id),
      };
    }
    case 'DELETE_LISTING':
      return { ...state, myListings: state.myListings.filter((l) => l.id !== action.id) };

    case 'START_CONVERSATION': {
      const existing = state.conversations.find(
        (c) => c.sellerId === action.sellerId && c.listingId === action.listingId
      );
      if (existing) return state;
      const conv = {
        id: uid('c'),
        sellerId: action.sellerId,
        listingId: action.listingId,
        unread: 0,
        typing: false,
        messages: [],
      };
      return { ...state, conversations: [conv, ...state.conversations] };
    }

    case 'SEND_MESSAGE': {
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.convId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { id: uid('m'), from: 'me', text: action.text, type: action.msgType || 'text', at: new Date().toISOString() },
                ],
              }
            : c
        ),
      };
    }

    case 'SET_TYPING':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.convId ? { ...c, typing: action.typing } : c
        ),
      };

    case 'RECEIVE_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.convId
            ? {
                ...c,
                typing: false,
                unread: action.markRead ? 0 : c.unread + 1,
                messages: [
                  ...c.messages,
                  { id: uid('m'), from: 'them', text: action.text, type: 'text', at: new Date().toISOString() },
                ],
              }
            : c
        ),
      };

    case 'READ_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.convId ? { ...c, unread: 0 } : c
        ),
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          { id: uid('n'), read: false, at: new Date().toISOString(), ...action.notification },
          ...state.notifications,
        ],
      };
    case 'READ_ALL_NOTIFICATIONS':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case 'READ_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      };

    case 'RESET':
      return { ...initialState, theme: state.theme, auth: state.auth };

    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const first = useRef(true);

  // Persist (skip the very first render)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state]);

  // Reflect theme to <html> + persist for pre-paint script
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    try {
      localStorage.setItem('kaira.theme', state.theme);
    } catch {
      /* ignore */
    }
  }, [state.theme]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// ---- Derived data helpers ----
export function useAllListings() {
  const { state } = useStore();
  // user listings first, then seed data (dedup by id)
  return useMemo(() => {
    const map = new Map();
    for (const l of [...state.myListings, ...LISTINGS]) {
      if (!map.has(l.id)) map.set(l.id, l);
    }
    return [...map.values()];
  }, [state.myListings]);
}

export function useCurrentUser() {
  const { state } = useStore();
  return state.auth.user;
}
