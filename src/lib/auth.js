// ============================================================
// Kaira account handling.
//
// Signup is free-by-design: email/password or a one-tap provider, both of
// which cost nothing per account. The expensive step — verifying a Zambian
// phone number over SMS — is deferred until the seller first lists something,
// where the trust badge actually earns the cost.
//
// Pure functions only, so the rules are testable without a store or UI.
// ============================================================

// Deliberately permissive: rejects the mistakes people actually make (missing
// @, no dot in the domain, spaces) without bouncing valid-but-unusual
// addresses. Real deliverability is proven by the verification mail, not regex.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function validateEmail(email) {
  const v = String(email || '').trim();
  if (!v) return 'Enter your email address';
  if (!EMAIL_RE.test(v)) return 'That email doesn’t look right';
  return null;
}

// Length beats character classes for real-world strength, so the floor is 8
// with a nudge rather than a wall of symbol rules.
export function validatePassword(pw) {
  const v = String(pw || '');
  if (!v) return 'Choose a password';
  if (v.length < 8) return 'Use at least 8 characters';
  if (/^\d+$/.test(v)) return 'Add letters too — digits alone are easy to guess';
  if (/^(password|12345678|qwerty)/i.test(v)) return 'That password is too common';
  return null;
}

export function passwordStrength(pw) {
  const v = String(pw || '');
  if (v.length < 8) return { score: 0, label: 'Too short' };
  let score = 1;
  if (v.length >= 12) score++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
  if (/\d/.test(v) && /[^\w\s]/.test(v)) score++;
  return { score: Math.min(score, 3), label: ['Weak', 'Fair', 'Good', 'Strong'][Math.min(score, 3)] };
}

export function validateName(name) {
  const v = String(name || '').trim();
  if (!v) return 'Enter your name';
  if (v.length < 2) return 'That name looks too short';
  return null;
}

// ---------------- Zambian phone numbers ----------------
// Accepts the shapes people actually type: 0977…, 26097…, +260 97…, spaced or
// not. Normalises everything to +2609XXXXXXXX.
export function normalisePhone(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return null;
  let local = digits;
  if (local.startsWith('260')) local = local.slice(3);
  else if (local.startsWith('0')) local = local.slice(1);
  // Zambian mobile numbers are 9 digits and start 9 (MTN/Airtel/Zamtel).
  if (local.length !== 9 || !/^9[5-7]/.test(local)) return null;
  return `+260${local}`;
}

export function validatePhone(input) {
  if (!String(input || '').trim()) return 'Enter your mobile number';
  return normalisePhone(input) ? null : 'Enter a valid Zambian mobile number';
}

// ---------------- Accounts ----------------
// Passwords are never stored in the clear, even in this local-only demo — the
// store keeps a hash so a dump of localStorage doesn't hand over credentials.
// This is NOT a substitute for server-side hashing (bcrypt/argon2) once a real
// backend exists; it only avoids storing plaintext on the device.
export function hashPassword(pw) {
  let h = 5381;
  const s = String(pw || '');
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `k1$${h.toString(36)}`;
}

export const emailKey = (email) => String(email || '').trim().toLowerCase();

export function findAccount(accounts, email) {
  const k = emailKey(email);
  return (accounts || []).find((a) => emailKey(a.email) === k) || null;
}

export function makeAccount({ name, email, phone = null, provider = 'email', password, town = '' }) {
  return {
    id: `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: String(name || '').trim(),
    handle: String(name || 'kaira')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 18) || 'kaira',
    email: emailKey(email),
    phone,
    provider, // 'email' | 'google' | 'apple'
    passwordHash: password ? hashPassword(password) : null,
    location: town || '',
    // Trust is earned in stages. Email is confirmed at signup (free); phone is
    // verified later, at the first listing, because SMS is the costly step.
    verified: [],
    phoneVerified: false,
    createdAt: new Date().toISOString(),
    rating: null,
    sales: 0,
  };
}

// Returns { user } or { error } — the caller decides how to surface it.
export function signUp(accounts, { name, email, password, town }) {
  const nameErr = validateName(name);
  if (nameErr) return { error: nameErr, field: 'name' };
  const emailErr = validateEmail(email);
  if (emailErr) return { error: emailErr, field: 'email' };
  const pwErr = validatePassword(password);
  if (pwErr) return { error: pwErr, field: 'password' };
  if (findAccount(accounts, email)) {
    return { error: 'An account with this email already exists. Sign in instead.', field: 'email' };
  }
  return { user: makeAccount({ name, email, password, town }) };
}

export function signIn(accounts, { email, password }) {
  const emailErr = validateEmail(email);
  if (emailErr) return { error: emailErr, field: 'email' };
  const acct = findAccount(accounts, email);
  // Same message for "no such account" and "wrong password" so the form can't
  // be used to discover which emails are registered.
  const generic = { error: 'Email or password is incorrect', field: 'password' };
  if (!acct) return generic;
  if (acct.provider !== 'email') {
    return { error: `This email is registered with ${acct.provider === 'google' ? 'Google' : 'Apple'}. Continue with it instead.`, field: 'email' };
  }
  if (acct.passwordHash !== hashPassword(password)) return generic;
  return { user: acct };
}

// A six-digit code. Real delivery happens server-side; this keeps the flow
// honest locally by actually checking what the user typed.
export function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function checkOtp(expected, entered) {
  const v = String(entered || '').replace(/\D/g, '');
  if (v.length !== 6) return 'Enter the 6-digit code';
  if (v !== String(expected)) return 'That code is incorrect';
  return null;
}

// ---------------- Gated actions ----------------
// Guests browse freely; an account is required the moment they act. The reason
// is shown in the prompt so the ask never feels arbitrary.
export const GATE_REASONS = {
  save: 'Create a free account to save listings',
  message: 'Create a free account to message sellers',
  sell: 'Create a free account to list an item',
  follow: 'Create a free account to follow sellers',
};

export function gateReason(action) {
  return GATE_REASONS[action] || 'Create a free account to continue';
}
