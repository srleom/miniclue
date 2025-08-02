"use client";

// react
import { useState } from "react";

// third-party
import { toast } from "sonner";

// actions
import { getStripePortalUrl } from "@/app/(dashboard)/_actions/user-actions";

// lib
import { logger } from "@/lib/logger";

export function useManageBilling() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleManageBilling() {
    setIsLoading(true);
    try {
      const { data: portalUrl, error } = await getStripePortalUrl();

      if (error) {
        logger.error("Failed to get portal URL:", error);
        toast.error("Failed to access billing portal. Please try again.");
        return;
      }

      if (portalUrl) {
        window.open(portalUrl, "_blank");
        toast.success("Redirecting to billing portal...");
      }
    } catch (error) {
      logger.error("Failed to get portal URL:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return { handleManageBilling, isLoading };
}
