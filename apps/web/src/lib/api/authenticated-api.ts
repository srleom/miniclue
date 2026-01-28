"use server";

// lib
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

// code
import createApi from ".";

export type ActionResponse<T> = {
  data?: T;
  error?: string;
};

export async function createAuthenticatedApi() {
  const supabase = await createSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return { error: "Auth error" };
  }

  if (!session) {
    return { error: "No session found" };
  }

  return { api: createApi(session.access_token), error: undefined };
}
