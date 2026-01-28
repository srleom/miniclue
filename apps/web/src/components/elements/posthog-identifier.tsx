"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

interface PostHogIdentifierProps {
  userId: string;
  email: string;
  name: string;
}

/**
 * Client component that identifies users in PostHog.
 * Should be mounted once per session after user authentication.
 */
export function PostHogIdentifier({
  userId,
  email,
  name,
}: PostHogIdentifierProps) {
  useEffect(() => {
    // Only identify if PostHog is initialized (production only)
    if (typeof window !== "undefined" && posthog.__loaded) {
      // Identify the user with their unique ID and properties
      posthog.identify(userId, {
        email,
        name,
      });
    }
  }, [userId, email, name]);

  // This component doesn't render anything
  return null;
}
