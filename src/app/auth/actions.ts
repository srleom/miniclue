"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function handleLogout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error);
    return;
  }

  // After logout, send user to login page
  redirect("/auth/login");
}
