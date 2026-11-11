// ============================================================
// Backend adapter — every network call the app makes, in one place.
//
// The store talks to this module, never to supabase directly. Each function
// takes and returns the app's own shapes (a `listing`, a `conversation`); the
// row <-> app mappers below are pure and unit-tested. When Supabase is not
// configured, nothing here is called and the app stays local-only.
// ============================================================
import { getClient, ensureClient, isConfigured } from './supabase.js';

export { isConfigured, ensureClient };

const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// ---------------- mappers (pure) ----------------

// camelCase listing → snake_case row. Only columns the table has; the
// sellerId is set by the caller from the session, never trusted from the
// listing object.
export function listingToRow(l, sellerId) {
  return {
    id: l.id,
    seller_id: sellerId,
    title: l.title,
    category: l.category,
    subcategory: l.subcategory ?? null,
    brand: l.brand ?? null,
    condition: l.condition ?? null,
    price: Number(l.price) || 0,
    negotiable: !!l.negotiable,
    price_label: l.priceLabel ?? null,
    price_suffix: l.priceSuffix ?? null,
    description: l.description || '',
    location: l.location ?? null,
    photos: Array.isArray(l.photos) ? l.photos : [],
    photo_count: l.photoCount ?? (Array.isArray(l.photos) ? l.photos.length : 0),
    listing_plan: l.listingPlan || 'mahala',
    contact_phone: l.contactPhone ?? null,
    delivery: Array.isArray(l.delivery) ? l.delivery : [],
    tags: Array.isArray(l.tags) ? l.tags : [],
    attrs: l.attrs || {},
    premium: !!l.premium,
    sponsored: !!l.sponsored,
    boosted_until: l.boostedUntil ? new Date(l.boostedUntil).toISOString() : null,
    boost_id: l.boostId ?? null,
  };
}

export function rowToListing(r) {
  if (!r) return null;
  return {
    id: r.id,
    sellerId: r.seller_id,
    title: r.title,
    category: r.category,
    subcategory: r.subcategory,
    brand: r.brand,
    condition: r.condition,
    price: Number(r.price) || 0,
    negotiable: !!r.negotiable,
    priceLabel: r.price_label,
    priceSuffix: r.price_suffix,
    description: r.description || '',
    location: r.location || null,
    photos: r.photos || [],
    photoCount: r.photo_count ?? (r.photos || []).length,
    listingPlan: r.listing_plan || 'mahala',
    contactPhone: r.contact_phone,
    delivery: r.delivery || [],
    tags: r.tags || [],
    attrs: r.attrs || {},
    premium: !!r.premium,
    sponsored: !!r.sponsored,
    views: r.views || 0,
    saves: r.saves || 0,
    status: r.status || 'active',
    // the app keeps boostedUntil as epoch ms (compared against Date.now())
    boostedUntil: r.boosted_until ? Date.parse(r.boosted_until) : undefined,
    boostId: r.boost_id || undefined,
    postedAt: r.posted_at,
    editedAt: r.edited_at || undefined,
    expiresAt: r.expires_at || undefined,
  };
}

export function rowToProfile(r, authUser) {
  if (!r && !authUser) return null;
  return {
    id: r?.id || authUser?.id,
    name: r?.name || authUser?.user_metadata?.name || '',
    handle: r?.handle || 'kaira',
    email: r?.email || authUser?.email || '',
    phone: r?.phone || null,
    phoneVerified: !!r?.phone_verified,
    location: r?.location || '',
    bio: r?.bio || '',
    avatarUrl: r?.avatar_url || null,
    provider: r?.provider || 'email',
    role: r?.role || 'member',
    plan: r?.plan || 'free',
    verified: r?.verified || [],
    rating: r?.rating ?? null,
    reviews: r?.reviews || 0,
    createdAt: r?.created_at || new Date().toISOString(),
    memberSince: (r?.created_at || new Date().toISOString()).slice(0, 7),
  };
}

export function profileToRow(patch) {
  const out = {};
  if (patch.name != null) out.name = patch.name;
  if (patch.handle != null) out.handle = patch.handle;
  if (patch.location != null) out.location = patch.location;
  if (patch.bio != null) out.bio = patch.bio;
  if (patch.phone != null) out.phone = patch.phone;
  if (patch.phoneVerified != null) out.phone_verified = patch.phoneVerified;
  if (patch.verified != null) out.verified = patch.verified;
  if (patch.avatarUrl != null) out.avatar_url = patch.avatarUrl;
  out.updated_at = new Date().toISOString();
  return out;
}

// Messages are stored neutrally (sender_id); the app renders them relative to
// whoever is looking: `from: 'me' | 'them'`.
export function rowToMessage(r, me) {
  return {
    id: r.id,
    senderId: r.sender_id,
    from: r.sender_id === me ? 'me' : 'them',
    text: r.body,
    type: r.kind || 'text',
    at: r.created_at,
    readAt: r.read_at || null,
  };
}

export function buildConversation(convRow, messageRows, me) {
  const messages = (messageRows || []).map((m) => rowToMessage(m, me));
  return {
    id: convRow.id,
    listingId: convRow.listing_id,
    buyerId: convRow.buyer_id,
    sellerId: convRow.seller_id,
    // whichever participant is not me — the person I'm talking to
    otherId: convRow.buyer_id === me ? convRow.seller_id : convRow.buyer_id,
    unread: messages.filter((m) => m.from === 'them' && !m.readAt).length,
    typing: false,
    updatedAt: convRow.updated_at,
    messages,
  };
}

export function rowToNotification(r) {
  return { id: r.id, type: r.type, title: r.title, body: r.body, read: !!r.read, at: r.created_at, meta: r.meta || {} };
}

// ---------------- guard ----------------
// All callers run after useBackendSync has awaited ensureClient() at boot.
function sb() {
  if (!isConfigured) throw new Error('Supabase is not configured');
  return getClient();
}

// ---------------- auth ----------------
export async function getSession() {
  const { data } = await sb().auth.getSession();
  return data.session || null;
}
export function onAuthChange(cb) {
  const { data } = sb().auth.onAuthStateChange((event, session) => cb(event, session));
  return () => data.subscription.unsubscribe();
}
export async function signUpEmail({ email, password, name }) {
  const { data, error } = await sb().auth.signUp({
    email, password,
    options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth?verified=1` },
  });
  if (error) return { error: error.message };
  // With "confirm email" on, session is null until they click the link.
  return { user: data.user, session: data.session, needsEmailConfirm: !data.session };
}
export async function signInEmail({ email, password }) {
  const { data, error } = await sb().auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { user: data.user, session: data.session };
}
export async function signInWithGoogle(returnTo = '/') {
  const { error } = await sb().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}` },
  });
  return error ? { error: error.message } : {};
}
export async function signOut() {
  await sb().auth.signOut();
}
export async function resetPassword(email) {
  const { error } = await sb().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset` });
  return error ? { error: error.message } : {};
}
export async function updatePassword(password) {
  const { error } = await sb().auth.updateUser({ password });
  return error ? { error: error.message } : {};
}

// ---------------- profiles ----------------
export async function fetchProfile(id) {
  const { data } = await sb().from('profiles').select('*').eq('id', id).maybeSingle();
  return data ? rowToProfile(data) : null;
}
export async function fetchProfiles(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return [];
  const { data } = await sb().from('profiles').select('*').in('id', unique);
  return (data || []).map((r) => rowToProfile(r));
}
export async function updateMyProfile(id, patch) {
  const { data, error } = await sb().from('profiles').update(profileToRow(patch)).eq('id', id).select().maybeSingle();
  if (error) return { error: error.message };
  return { profile: rowToProfile(data) };
}

// ---------------- listings ----------------
export async function fetchActiveListings(limit = 500) {
  const { data, error } = await sb()
    .from('listings').select('*').eq('status', 'active').order('posted_at', { ascending: false }).limit(limit);
  if (error) return { error: error.message, listings: [] };
  return { listings: (data || []).map(rowToListing) };
}
export async function fetchMyListings(sellerId) {
  const { data } = await sb().from('listings').select('*').eq('seller_id', sellerId).order('posted_at', { ascending: false });
  return (data || []).map(rowToListing);
}
export async function publishListing(listing, sellerId) {
  const { data, error } = await sb().from('listings').insert(listingToRow(listing, sellerId)).select().single();
  if (error) return { error: error.message };
  return { listing: rowToListing(data) };
}
export async function updateListing(id, patch, sellerId) {
  const row = listingToRow({ ...patch, id }, sellerId);
  delete row.id; delete row.seller_id;
  row.edited_at = new Date().toISOString();
  const { data, error } = await sb().from('listings').update(row).eq('id', id).select().single();
  if (error) return { error: error.message };
  return { listing: rowToListing(data) };
}
export async function patchListing(id, fields) {
  const { error } = await sb().from('listings').update(fields).eq('id', id);
  return error ? { error: error.message } : {};
}
export async function deleteListing(id) {
  const { error } = await sb().from('listings').update({ status: 'removed' }).eq('id', id);
  return error ? { error: error.message } : {};
}
export async function bumpView(id) {
  await sb().rpc('increment_views', { p_listing_id: id });
}

// ---------------- saves & follows ----------------
export async function fetchMySaves(userId) {
  const { data } = await sb().from('saves').select('listing_id').eq('user_id', userId).order('created_at', { ascending: false });
  return (data || []).map((r) => r.listing_id);
}
export async function setSaved(userId, listingId, on) {
  const q = on
    ? sb().from('saves').upsert({ user_id: userId, listing_id: listingId }, { onConflict: 'user_id,listing_id' })
    : sb().from('saves').delete().eq('user_id', userId).eq('listing_id', listingId);
  const { error } = await q;
  return error ? { error: error.message } : {};
}
export async function fetchMyFollows(userId) {
  const { data } = await sb().from('follows').select('seller_id').eq('follower_id', userId);
  return (data || []).map((r) => r.seller_id);
}
export async function setFollow(userId, sellerId, on) {
  const q = on
    ? sb().from('follows').upsert({ follower_id: userId, seller_id: sellerId }, { onConflict: 'follower_id,seller_id' })
    : sb().from('follows').delete().eq('follower_id', userId).eq('seller_id', sellerId);
  const { error } = await q;
  return error ? { error: error.message } : {};
}

// ---------------- conversations & messages ----------------
export async function fetchMyConversations(me) {
  const { data: convs } = await sb()
    .from('conversations').select('*').or(`buyer_id.eq.${me},seller_id.eq.${me}`)
    .order('updated_at', { ascending: false });
  if (!convs?.length) return [];
  const ids = convs.map((c) => c.id);
  const { data: msgs } = await sb().from('messages').select('*').in('conversation_id', ids).order('created_at', { ascending: true });
  const byConv = new Map();
  for (const m of msgs || []) {
    if (!byConv.has(m.conversation_id)) byConv.set(m.conversation_id, []);
    byConv.get(m.conversation_id).push(m);
  }
  return convs.map((c) => buildConversation(c, byConv.get(c.id) || [], me));
}
export async function startConversation({ id, listingId, sellerId, buyerId }) {
  // One thread per (listing, buyer). Return the existing one if it's there.
  const { data: existing } = await sb()
    .from('conversations').select('*').eq('listing_id', listingId).eq('buyer_id', buyerId).maybeSingle();
  if (existing) return { conversation: buildConversation(existing, [], buyerId) };
  const { data, error } = await sb()
    .from('conversations').insert({ id: id || uid('c'), listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
    .select().single();
  if (error) return { error: error.message };
  return { conversation: buildConversation(data, [], buyerId) };
}
export async function sendMessage({ id, convId, senderId, text, kind = 'text' }) {
  const { data, error } = await sb()
    .from('messages').insert({ id: id || uid('m'), conversation_id: convId, sender_id: senderId, body: text, kind })
    .select().single();
  if (error) return { error: error.message };
  return { message: rowToMessage(data, senderId) };
}
export async function markConversationRead(convId, me) {
  await sb().from('messages').update({ read_at: new Date().toISOString() })
    .eq('conversation_id', convId).neq('sender_id', me).is('read_at', null);
}
// Live inbound messages and new threads for the signed-in user. Filters run
// server-side where possible; RLS guarantees we only ever receive our own.
export function subscribeInbox(me, { onMessage, onConversation, onNotification }) {
  const ch = sb().channel(`inbox:${me}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
      if (p.new && p.new.sender_id !== me) onMessage?.(rowToMessage(p.new, me), p.new.conversation_id);
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, (p) => {
      if (p.new && (p.new.buyer_id === me || p.new.seller_id === me)) onConversation?.(buildConversation(p.new, [], me));
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${me}` }, (p) => {
      if (p.new) onNotification?.(rowToNotification(p.new));
    })
    .subscribe();
  return () => { sb().removeChannel(ch); };
}
// New/changed listings from everyone, for a live feed.
export function subscribeListings({ onUpsert, onRemove }) {
  const ch = sb().channel('listings:feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, (p) => {
      if (p.eventType === 'DELETE') onRemove?.(p.old?.id);
      else if (p.new?.status === 'active') onUpsert?.(rowToListing(p.new));
      else if (p.new) onRemove?.(p.new.id);
    })
    .subscribe();
  return () => { sb().removeChannel(ch); };
}

// ---------------- reports & notifications ----------------
export async function reportListing(listingId, reporterId, reason) {
  const { error } = await sb().from('reports').insert({ listing_id: listingId, reporter_id: reporterId, reason });
  return error ? { error: error.message } : {};
}
export async function fetchMyNotifications(userId) {
  const { data } = await sb().from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
  return (data || []).map(rowToNotification);
}
export async function markNotificationRead(id) {
  await sb().from('notifications').update({ read: true }).eq('id', id);
}
export async function markAllNotificationsRead(userId) {
  await sb().from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
}

// ---------------- storage ----------------
function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',');
  const mime = (head.match(/data:(.*?);/) || [])[1] || 'image/jpeg';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { blob: new Blob([bytes], { type: mime }), ext: mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg' };
}
// Upload any data-URL photos under {userId}/{listingId}/; pass http(s) URLs
// through untouched so an edit never re-uploads what's already stored.
export async function uploadPhotos(userId, listingId, photos) {
  const out = [];
  let n = 0;
  for (const src of photos || []) {
    if (!src || !src.startsWith('data:')) { out.push(src); continue; }
    const { blob, ext } = dataUrlToBlob(src);
    const path = `${userId}/${listingId}/${Date.now().toString(36)}-${n++}.${ext}`;
    const { error } = await sb().storage.from('listing-photos').upload(path, blob, { contentType: blob.type, upsert: false });
    if (error) { out.push(src); continue; } // keep the local copy rather than lose the photo
    const { data } = sb().storage.from('listing-photos').getPublicUrl(path);
    out.push(data.publicUrl);
  }
  return out;
}
