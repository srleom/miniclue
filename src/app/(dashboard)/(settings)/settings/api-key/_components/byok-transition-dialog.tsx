"use client";

// icons
import { Scale, Coins, Leaf, HeartHandshake, Info } from "lucide-react";

// components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BYOKTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const benefits = [
  {
    title: "Fairness",
    icon: <Scale className="h-5 w-5 text-indigo-500" />,
    description:
      "You pay only for what you use — no monthly subscriptions or unused credits.",
  },
  {
    title: "Zero Markup",
    icon: <Coins className="h-5 w-5 text-amber-500" />,
    description:
      "All costs are billed directly by the provider with no markup from us. We don't take a cent.",
  },
  {
    title: "Sustainability",
    icon: <Leaf className="h-5 w-5 text-emerald-500" />,
    description:
      "MiniClue can continue improving without limiting usage or charging arbitrary subscription tiers.",
  },
];

export function BYOKTransitionDialog({
  open,
  onOpenChange,
}: BYOKTransitionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-[600px]">
        {/* Header with Visual */}
        <div className="p-6 pb-2">
          <DialogHeader>
            <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl sm:mx-0">
              <Scale className="text-primary h-6 w-6" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl">
              Moving to a BYOK Model
            </DialogTitle>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-8 px-6 pb-6">
            {/* The "Why" - Context Section */}
            <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
              <p>
                Our goal has always been to build the best lecture explainer
                <span className="text-foreground font-medium">
                  {" "}
                  for students, by students
                </span>
                . To ensure MiniClue remains accessible to everyone without
                locking features behind expensive subscription tiers, we are
                open-sourcing MiniClue and transitioning to a Bring Your Own Key
                (BYOK) model.
              </p>

              <div className="bg-muted/40 border-primary/50 flex gap-3 rounded-lg border-l-2 p-4">
                <Info className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-foreground/90 font-medium">
                  MiniClue has been, and will always be, free for all to use. In
                  our new BYOK model, you only pay for your own API usage.
                </p>
              </div>
            </div>

            {/* The "What" - Benefits Grid */}
            <div>
              <h3 className="text-foreground mb-4 text-sm font-semibold">
                What this means for you
              </h3>
              <div className="grid gap-4 sm:grid-cols-1">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="bg-card hover:bg-accent/50 flex items-start gap-4 rounded-lg border p-3 transition-colors"
                  >
                    <div className="bg-background mt-1 shrink-0 rounded-full border p-2 shadow-sm">
                      {benefit.icon}
                    </div>
                    <div>
                      <h4 className="text-foreground text-sm font-medium">
                        {benefit.title}
                      </h4>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* The "Feeling" - Founder Note */}
            <div className="relative overflow-hidden rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50 p-5 dark:border-rose-900/50 dark:from-rose-950/20 dark:to-orange-950/20">
              <div className="flex gap-4">
                <div className="h-fit shrink-0 rounded-full bg-white p-2 dark:bg-rose-950/50">
                  <HeartHandshake className="h-5 w-5 text-rose-500" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-rose-900 dark:text-rose-100">
                    Your support creates our future
                  </h4>
                  <p className="text-sm leading-relaxed text-rose-700/80 dark:text-rose-200/70">
                    Thank you for being a part of our journey. We&apos;re
                    excited to continue building MiniClue with you, and we
                    appreciate your understanding as we make this important
                    shift.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="bg-muted/10 flex justify-end border-t px-6 py-4">
          <Button
            onClick={() => onOpenChange(false)}
            size="default"
            className="w-full sm:w-auto"
          >
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
