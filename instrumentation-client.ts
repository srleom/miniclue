import posthog from "posthog-js";

// Only initialize PostHog if running on the production domain
const isProductionDomain =
  typeof window !== "undefined" &&
  window.location.origin === "https://app.miniclue.com";

if (isProductionDomain) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2025-05-24",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}
