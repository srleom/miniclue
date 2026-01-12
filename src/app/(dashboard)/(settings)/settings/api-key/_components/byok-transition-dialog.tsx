"use client";

// icons
import {
  Scale,
  Coins,
  Leaf,
  HeartHandshake,
  Info,
  Sparkles,
  ExternalLink,
} from "lucide-react";

// components
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
      "You pay only for what you use. No monthly subscriptions or unused credits.",
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
          <DialogHeader className="text-left">
            <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
              <Sparkles className="text-primary h-6 w-6" />
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
                Our goal has always been to build the best AI chat experience
                for your lecture slides. To ensure MiniClue remains{" "}
                <strong>free and accessible to all</strong>, we are
                open-sourcing MiniClue and transitioning to a Bring Your Own Key
                (BYOK) model. Learn more{" "}
                <Link
                  href="https://www.miniclue.com/blog/launch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  here
                </Link>
                .
              </p>

              <div className="bg-muted/40 border-primary/50 flex flex-col items-start gap-4 rounded-lg border-l-2 p-4 text-left sm:flex-row">
                <Info className="text-primary mt-1 h-5 w-5 shrink-0" />
                <p className="text-foreground/90 font-medium">
                  In this new BYOK model, you pay only for your own API usage.
                </p>
              </div>
            </div>

            {/* The "What" - Benefits Grid */}
            <div>
              <h3 className="text-foreground mb-4 text-left text-sm font-semibold">
                What this means for you
              </h3>
              <div className="grid gap-4 sm:grid-cols-1">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="bg-card hover:bg-accent/50 flex flex-col items-start gap-4 rounded-lg border p-4 text-left transition-colors sm:flex-row"
                  >
                    <div className="bg-background shrink-0 rounded-full border p-2 shadow-sm">
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

            {/* Pro Tip Box */}
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex flex-col items-start gap-4 text-left sm:flex-row">
                <div className="h-fit shrink-0 rounded-full bg-white p-2 dark:bg-blue-950/50">
                  <Sparkles className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    But wait... there&apos;s good news!
                  </p>
                  <p className="text-sm leading-relaxed text-blue-700 dark:text-blue-300">
                    Google Gemini offers a <strong>generous free tier</strong>.
                    Most users can use MiniClue completely for free without
                    buying credits.
                  </p>
                  <Link
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-sm font-semibold text-blue-700 underline decoration-blue-400/50 underline-offset-2 transition-colors hover:text-blue-800 hover:decoration-blue-600 dark:text-blue-300 dark:hover:text-blue-200"
                  >
                    Get your free key here
                    <ExternalLink className="h-3 w-3 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Founder Note */}
            <div className="relative overflow-hidden rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50 p-4 dark:border-rose-900/50 dark:from-rose-950/20 dark:to-orange-950/20">
              <div className="flex flex-col items-start gap-4 text-left sm:flex-row">
                <div className="h-fit shrink-0 rounded-full bg-white p-2 dark:bg-rose-950/50">
                  <HeartHandshake className="h-5 w-5 text-rose-500" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                    Your support creates our future.
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
        <div className="bg-muted/10 flex justify-start border-t px-6 py-4">
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
