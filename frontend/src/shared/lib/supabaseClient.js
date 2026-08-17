import { createClient } from "@supabase/supabase-js";

// Supabase is used strictly as an identity provider here (docs/04-auth-security.md §1) —
// the anon key is safe to expose client-side; it grants no access to business data since
// none of it lives in Supabase's Postgres.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
