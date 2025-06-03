"use server"

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function handleLogin() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback?next=/dashboard",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Login error:", error);
      return;
    }

    if (data.url) {
      redirect(data.url);
    }
  }

export async function handleLogout() {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    redirect("/");
  }

