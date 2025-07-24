"use server";

import { redirect } from "next/navigation";
import { oauthSignIn } from "@/lib/auth";

export async function handleOAuthLogin() {
  const { data, error } = await oauthSignIn("google", "login");
  if (error) {
    console.error("Login error:", error);
    return;
  }
  if (data.url) {
    redirect(data.url);
  }
}
