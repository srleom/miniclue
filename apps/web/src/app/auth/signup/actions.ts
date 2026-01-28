"use server";

import { redirect } from "next/navigation";
import { oauthSignIn } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function handleOAuthSignup() {
  const { data, error } = await oauthSignIn("google", "signup");
  if (error) {
    logger.error("Signup error:", error);
    return;
  }
  if (data.url) {
    redirect(data.url);
  }
}
