// ─── Supabase Client ─────────────────────────────────────────────────────────
// Drop this file at:  src/integrations/supabase/client.ts
//
// Your project ID: mlnvpxagdcqcayedjhld
// Get your anon key from:
//   Supabase Dashboard → Settings → API → "anon public" key

import { createClient } from "@supabase/supabase-js";

// SECURITY: Read strictly from environment variables. Do NOT hardcode API URLs or Anon Keys.
// If these are missing at runtime or build time, fail fast to prevent silent degradation.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables. Please check your .env file.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // required for Google OAuth redirect
  },
});