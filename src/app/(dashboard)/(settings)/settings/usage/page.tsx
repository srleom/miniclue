// react
import { Suspense } from "react";

// components
import { Card, CardContent } from "@/components/ui/card";

// lib
import { formatDate } from "@/lib/utils";

// actions
import { getUserUsage } from "@/app/(dashboard)/_actions/user-actions";

// components
import { Badge } from "@/components/ui/badge";

async function UsageContent() {
  const { data: usage, error } = await getUserUsage();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">Failed to load usage</p>
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">No usage data found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 flex w-full flex-col items-center md:mt-16 lg:w-3xl">
      <div className="flex w-full flex-col gap-6">
        <h1 className="text-2xl font-medium">Usage</h1>

        <Card>
          <CardContent>
            {/* Usage Information Section */}
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Plan */}
                <div className="border-border flex items-center justify-between gap-4 border-b pb-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">Plan</label>
                    <p className="text-muted-foreground text-xs">
                      Your current subscription plan
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-end text-sm break-all">
                      {usage.plan_name || "No active plan"}
                    </span>
                    {usage.status === "past_due" && (
                      <Badge variant="destructive" className="text-xs">
                        Past Due
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Billing Period */}
                {usage.billing_period_start && usage.billing_period_end && (
                  <div className="border-border flex items-center justify-between gap-4 border-b pb-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium">
                        Billing period
                      </label>
                      <p className="text-muted-foreground text-xs">
                        Your current billing cycle
                      </p>
                    </div>
                    <div className="flex flex-col items-end text-end text-sm">
                      <span className="block break-all sm:hidden">
                        {formatDate(usage.billing_period_start)} - <br />
                        {formatDate(usage.billing_period_end)}
                      </span>
                      <span className="hidden break-all sm:block">
                        {`${formatDate(usage.billing_period_start)} - ${formatDate(usage.billing_period_end)}`}
                      </span>
                    </div>
                  </div>
                )}
                {/* Current Usage */}
                <div className="border-border flex items-center justify-between gap-4 border-b pb-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">Current usage</label>
                    <p className="text-muted-foreground text-xs">
                      Lectures uploaded this billing period
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-end text-sm break-all">
                      {usage.current_usage || 0} /{" "}
                      {usage.max_uploads === -1
                        ? "∞"
                        : usage.max_uploads || "∞"}
                    </span>
                  </div>
                </div>

                {/* Max Size per Lecture */}
                <div className="border-border flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">
                      Max size per lecture
                    </label>
                    <p className="text-muted-foreground text-xs">
                      Maximum file size allowed per lecture
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-end text-sm break-all">
                      {usage.max_size_mb === -1
                        ? "∞"
                        : usage.max_size_mb
                          ? `${usage.max_size_mb} MB`
                          : "∞"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-4 flex w-full flex-col items-center md:mt-16 lg:w-3xl">
          <div className="flex w-full flex-col gap-6">
            <h1 className="text-2xl font-medium">Usage</h1>
            <div className="flex items-center">
              <p className="text-muted-foreground">Loading usage...</p>
            </div>
          </div>
        </div>
      }
    >
      <UsageContent />
    </Suspense>
  );
}
