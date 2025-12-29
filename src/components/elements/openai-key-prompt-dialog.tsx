"use client";

// react
import { useState, useEffect } from "react";

// icons
import {
  Key,
  Sparkles,
  ShieldCheck,
  FileSearch,
  ExternalLink,
  ChevronRight,
  Lock,
} from "lucide-react";

// components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

// actions
import { getUser } from "@/app/(dashboard)/_actions/user-actions";

const features = [
  {
    icon: <FileSearch className="h-5 w-5 text-blue-500" />,
    title: "Deep Context Analysis",
    description: "AI reads your PDFs to give accurate, cited answers.",
  },
  {
    icon: <Sparkles className="h-5 w-5 text-indigo-500" />,
    title: "Direct Model Access",
    description: "Pay OpenAI directly. We don't mark up usage costs.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
    title: "Secure & Private",
    description: "Your key is encrypted locally. We can never see it.",
  },
];

export function OpenAIKeyPromptDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: user, error } = await getUser();
        if (error || !user) return;

        const hasOpenAIKey = user.api_keys_provided?.openai ?? false;

        if (!hasOpenAIKey) {
          setOpen(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[480px]">
        {/* Hero / Header Section */}
        <div className="from-muted/50 to-background relative bg-gradient-to-b p-8 pb-6 text-center">
          {/* Decorative background blur (optional) */}
          <div className="bg-grid-slate-100 dark:bg-grid-slate-700/25 absolute inset-0 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-background ring-border/50 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm ring-1 ring-inset">
              <Key className="text-primary h-8 w-8" />
            </div>

            <DialogHeader>
              <DialogTitle className="text-center text-xl font-semibold tracking-tight">
                Unlock Intelligent Analysis
              </DialogTitle>
              <p className="text-muted-foreground mx-auto mt-2 max-w-[350px] text-center text-sm leading-relaxed">
                MiniClue requires your OpenAI API key to process lectures and
                generate answers.
              </p>
            </DialogHeader>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-background px-8 pt-2 pb-8">
          {/* Feature List */}
          <div className="space-y-6">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <div className="bg-muted/50 border-background flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm">
                    {feature.icon}
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm leading-none font-medium">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-border my-8 h-px" />

          {/* Helper Box */}
          <div className="bg-muted/30 flex items-center justify-between rounded-lg border p-3 pr-4">
            <div className="flex items-center gap-3">
              <div className="bg-background flex h-8 w-8 items-center justify-center rounded-full border">
                <Lock className="text-muted-foreground h-3.5 w-3.5" />
              </div>
              <span className="text-muted-foreground text-xs font-medium">
                No API key?
              </span>
            </div>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 flex items-center gap-1.5 text-xs font-semibold transition-colors"
            >
              Get one from OpenAI
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 grid gap-3">
            <Link href="/settings/api-key" className="w-full">
              <Button
                className="shadow-primary/10 w-full gap-2 font-medium shadow-lg"
                size="lg"
                onClick={() => setOpen(false)}
              >
                Connect API Key
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              I&apos;ll do this later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
