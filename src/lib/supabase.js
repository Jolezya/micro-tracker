// The anon key is designed to live in a browser bundle — Row Level Security
// in supabase/migrations is what protects data, not secrecy of this key. The
// service-role key must NEVER appear here or in any VITE_ variable.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Configured = both values present. Without them the app runs exactly as it
// did before Phase 1: single-device, localStorage only — and, because the
// client below is imported lazily, without shipping supabase-js at all
// (~240 KB that a tester on mobile data would otherwise download for nothing).
export const isConfigured = Boolean(url && anonKey);

// Host of the project, for diagnostics ("connected to xyz.supabase.co").
export const projectHost = isConfigured ? new URL(url).host : null;

let client = null;
let loading = null;

// Create the client once, on first need. Vite splits @supabase/supabase-js
// into its own chunk that only loads when this runs.
export function ensureClient() {
  if (!isConfigured) return Promise.resolve(null);
  if (client) return Promise.resolve(client);
  if (!loading) {
    loading = import('@supabase/supabase-js').then(({ createClient }) => {
      client = createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        realtime: { params: { eventsPerSecond: 5 } },
      });
      return client;
    });
  }
  return loading;
}

// Synchronous access for code that runs after boot (the store sync awaits
// ensureClient() before anything else touches the backend).
export function getClient() {
  if (!client) throw new Error('Supabase client not ready — ensureClient() has not completed');
  return client;
}
