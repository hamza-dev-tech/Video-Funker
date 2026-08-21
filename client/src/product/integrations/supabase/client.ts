// Optional Supabase client.
//
// Nothing in the product app imports this today — authentication runs through
// the Video Funker API (see lib/api-client.ts). It is kept so a future feature
// can reach for Supabase without regenerating the typed client, and it is
// written to be import-safe: createClient throws on an undefined URL, which
// would take down any module that touched this file before the two public env
// vars were set. Calling getSupabase() surfaces that as a clear error at the
// call site instead.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: typeof window === 'undefined' ? undefined : window.localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}
