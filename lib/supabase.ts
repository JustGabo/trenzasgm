import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createSupabaseClient(url, key);
}

export type Appointment = {
  id?: string;
  email: string;
  client_name: string | null;
  date: string;
  time_slot: string;
  service_id: string | null;
  created_at?: string;
};
