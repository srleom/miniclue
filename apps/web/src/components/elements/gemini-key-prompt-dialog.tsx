"use client";

// react
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// icons
import {
  Key,
  Sparkles,
  ShieldCheck,
  FileSearch,
  ExternalLink,
  ChevronRight,
  Zap,
} from "lucide-react";

// components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// actions
import { getUser } from "@/app/(dashboard)/_actions/user-actions";

const features = [
  {
    icon: <FileSearch className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    title: "Deep Context Analysis",
    description: "AI reads your PDFs to give accurate, contextual answers.",
  },
  {
    icon: <Zap className="h-4 w-4 text-amber-500" />,
    title: "Direct Model Access",
    description: "Connect directly to Google. We don't mark up costs.",
  },
  {
    icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
    title: "Secure & Private",
    description: "Your key is encrypted on the server. We never see it.",
  },
];

export function GeminiKeyPromptDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: user, error } = await getUser();
        if (error || !user) return;

        const hasGeminiKey = user.api_keys_provided?.gemini ?? false;

        if (!hasGeminiKey) {
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
        {/* Header / Hero */}
        <div className="relative overflow-hidden pt-10 pb-6 text-center">
          <div className="relative z-10 flex flex-col items-center px-6">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
              <Key className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>

            <DialogHeader className="space-y-1">
              <DialogTitle className="text-center text-2xl font-semibold">
                Unlock Lecture Intelligence
              </DialogTitle>
              <p className="text-muted-foreground mx-auto max-w-[400px] text-center text-sm">
                To get started, add your Gemini API key. MiniClue uses your key
                to process lectures and generate answers.
              </p>
            </DialogHeader>
          </div>
        </div>

        {/* Content */}
        <div className="bg-background px-6 pb-6">
          {/* Feature List */}
          <div className="mb-8 space-y-5">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3.5">
                <div className="mt-0.5 flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    {feature.icon}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-foreground text-sm font-medium">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tip Box */}
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="flex gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Good news!
                </p>
                <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                  Google Gemini offers a <strong>generous free tier</strong>.
                  Most users can use MiniClue completely for free without buying
                  credits.
                </p>
                <Link
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-xs font-semibold text-blue-700 underline decoration-blue-400/50 underline-offset-2 transition-colors hover:text-blue-800 hover:decoration-blue-600 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  Get your free key here
                  <ExternalLink className="h-3 w-3 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Link
              href={`/settings/api-key?returnTo=${encodeURIComponent(pathname)}`}
              className="w-full"
            >
              <Button size="lg" className="w-full gap-2 text-sm font-semibold">
                Add Gemini API Key
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground h-9 text-sm"
            >
              I&apos;ll do this later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
