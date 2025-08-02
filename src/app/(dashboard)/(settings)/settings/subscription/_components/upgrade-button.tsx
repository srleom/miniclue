"use client";

// react
import { useState } from "react";

// third-party
import { toast } from "sonner";

// components
import { Button } from "@/components/ui/button";

// actions
import { createCheckoutSession } from "@/app/(dashboard)/_actions/user-actions";

// lib
import { logger } from "@/lib/logger";

interface UpgradeButtonProps {
  plan: "monthly_launch" | "annual_launch";
  variant?: "outline" | "default" | "secondary" | "destructive" | "ghost";
}

export function UpgradeButton({ plan, variant }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpgradeToPro(formData: FormData) {
    setIsLoading(true);
    try {
      const planType = formData.get("plan") as
        | "monthly"
        | "annual"
        | "monthly_launch"
        | "annual_launch";
      const { data: checkoutUrl, error } =
        await createCheckoutSession(planType);

      if (error) {
        logger.error("Failed to create checkout session:", error);
        toast.error("Failed to create checkout session. Please try again.");
        return;
      }

      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank");
        toast.success("Redirecting to checkout...");
      }
    } catch (error) {
      logger.error("Failed to create checkout session:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Show only the specific plan button
  return (
    <form action={handleUpgradeToPro}>
      <input type="hidden" name="plan" value={plan} />
      <Button
        type="submit"
        size="sm"
        variant={variant}
        className="w-full hover:cursor-pointer"
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Subscribe"}
      </Button>
    </form>
  );
}
