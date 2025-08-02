"use client";

// react
import { useEffect, useState } from "react";

// next/navigation
import { useRouter } from "next/navigation";

// third-party
import { toast } from "sonner";

// lib
import { isSubscriptionPastDue } from "@/lib/utils";
import { logger } from "@/lib/logger";

// actions
import { getUserSubscription } from "@/app/(dashboard)/_actions/user-actions";

// types
import type { components } from "@/types/api";

type SubscriptionData =
  components["schemas"]["app_internal_api_v1_dto.SubscriptionResponseDTO"];

export function PaymentWarningToast() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<
    SubscriptionData | undefined
  >();

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const result = await getUserSubscription();
        if (!result.error) {
          setSubscription(result.data);
        } else {
          // User is not authenticated, which is expected for unauthenticated users
          logger.debug(
            "User not authenticated, skipping subscription fetch:",
            result.error,
          );
        }
      } catch (error) {
        logger.error("Failed to fetch subscription:", error);
      }
    }

    fetchSubscription();
  }, []);

  useEffect(() => {
    if (isSubscriptionPastDue(subscription)) {
      // Show persistent toast for past due subscription
      toast.error(
        "Your last payment failed. Please update your payment method to continue using MiniClue.",
        {
          id: "payment-warning", // Use consistent ID to prevent duplicates
          duration: Infinity, // Make it persistent
          action: {
            label: "Update Payment",
            onClick: () => {
              // Dismiss the toast when action is clicked
              toast.dismiss("payment-warning");
              // Navigate to subscription settings page
              router.push("/settings/subscription");
            },
          },
          actionButtonStyle: {
            backgroundColor: "#fff",
            color: "var(--primary)",
            border: "1px solid var(--primary)",
          },
        },
      );
    } else {
      // Dismiss the payment warning toast if subscription is not past due
      toast.dismiss("payment-warning");
    }
  }, [subscription, router]);

  // This component doesn't render anything visible
  return null;
}
