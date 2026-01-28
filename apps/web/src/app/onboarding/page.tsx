"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Image as ImageIcon,
  Layers,
  Key,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Sparkle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { storeAPIKey } from "@/app/(dashboard)/(settings)/settings/api-key/_actions/api-key-actions";
import { getUser } from "@/app/(dashboard)/_actions/user-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const apiKeySchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

const StepIndicator = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => (
  <div className="mb-14 flex gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        animate={{
          width: i + 1 === current ? 32 : 8,
          opacity: i + 1 <= current ? 1 : 0.2,
          backgroundColor:
            i + 1 === current ? "var(--primary)" : "var(--muted-foreground)",
        }}
        className="h-1 rounded-full transition-all duration-500 ease-in-out"
      />
    ))}
  </div>
);

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: "",
    },
  });

  useEffect(() => {
    setMounted(true);

    const checkGeminiKey = async () => {
      try {
        const { data: user } = await getUser();
        if (user?.api_keys_provided?.gemini) {
          router.push("/");
          return;
        }
      } catch (error) {
        console.error("Failed to check gemini key:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkGeminiKey();
  }, [router]);

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = async (values: ApiKeyFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await storeAPIKey("gemini", values.apiKey);
      if (result.error) {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Failed to verify key",
        );
      } else {
        toast.success("API key successfully added");
        handleNext();
      }
    } catch {
      toast.error("System error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || isLoading) return null;

  return (
    <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground relative min-h-screen overflow-x-hidden">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-start justify-start px-6 py-20">
        <StepIndicator current={step} total={totalSteps} />
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex w-full flex-col items-start gap-12"
          >
            {step === 1 && (
              <div className="relative flex min-h-[60vh] w-full flex-col items-start gap-8 overflow-hidden text-left lg:h-[calc(100vh-14rem)]">
                <div className="flex flex-col items-start gap-8">
                  <div className="bg-primary flex items-center gap-2 rounded-lg p-2">
                    <Sparkle className="text-primary-foreground size-7" />
                  </div>
                  <h1 className="from-primary/100 to-primary/80 max-w-2xl bg-gradient-to-br bg-clip-text text-5xl tracking-tight text-transparent sm:text-8xl">
                    Welcome to MiniClue
                  </h1>

                  <p className="text-muted-foreground max-w-md text-left text-lg leading-relaxed">
                    The AI chat experience for your lecture slides
                  </p>

                  <div className="flex gap-4">
                    <Button size="lg" onClick={handleNext}>
                      Get started
                      <ChevronRight className="size-4 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex w-full flex-col items-start gap-12 text-left">
                <div className="space-y-4">
                  <h2 className="text-4xl tracking-tight sm:text-5xl">
                    How MiniClue helps you study
                  </h2>
                </div>

                <div className="grid w-full gap-6 md:grid-cols-3">
                  {[
                    {
                      icon: BookOpen,
                      title: "Split-screen view",
                      desc: "Read and chat in a single, cohesive view.",
                      color: "text-blue-500",
                      bg: "bg-blue-500/5",
                    },
                    {
                      icon: ImageIcon,
                      title: "Instant context",
                      desc: "@Current Slide shares a screenshot of exactly what you're looking at.",
                      color: "text-amber-500",
                      bg: "bg-amber-500/5",
                    },
                    {
                      icon: Layers,
                      title: "Model Agnostic",
                      desc: "Connect to Google, OpenAI, or Anthropic.",
                      color: "text-purple-500",
                      bg: "bg-purple-500/5",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-secondary/50 group flex flex-col items-start gap-6 rounded-3xl border border-transparent p-6 text-left transition-colors"
                    >
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-2xl",
                          item.bg,
                          item.color,
                        )}
                      >
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1 text-left">
                        <h4 className="text-2xl tracking-tight">
                          {item.title}
                        </h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" size="lg" onClick={handleBack}>
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                  <Button size="lg" onClick={handleNext}>
                    Continue
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex w-full flex-col items-start gap-12 text-left">
                <div className="space-y-4">
                  <h2 className="text-4xl tracking-tight sm:text-5xl">
                    To get started, add your Gemini API key
                  </h2>
                </div>

                <div className="grid w-full gap-4">
                  {[
                    {
                      icon: Key,
                      label: "What is an API key?",
                      desc: "A unique digital identifier that lets providers like Google verify your sessions and resource usage.",
                      accent: "bg-blue-500/10 text-blue-500",
                    },
                    {
                      icon: Zap,
                      label: "Why Gemini?",
                      desc: "MiniClue uses Gemini for core processing. And since Gemini has a generous free tier, most users can use MiniClue essentially for free.",
                      accent: "bg-amber-500/10 text-amber-500",
                    },
                    {
                      icon: ShieldCheck,
                      label: "Is it safe to store my API key with MiniClue?",
                      desc: "Yes. Your API key is encrypted and stored securely on our servers. No one can see your key, not even us.",
                      accent: "bg-emerald-500/10 text-emerald-500",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-secondary/50 group flex max-w-2xl flex-col gap-6 rounded-3xl border border-transparent p-6 text-left transition-colors sm:flex-row"
                    >
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
                          item.accent,
                        )}
                      >
                        <item.icon className="size-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">{item.label}</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex w-full gap-4">
                  <Button variant="outline" size="lg" onClick={handleBack}>
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                  <Button size="lg" onClick={handleNext}>
                    Continue
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex w-full flex-col items-start gap-12 text-left">
                <div className="space-y-2">
                  <h2 className="text-4xl tracking-tight sm:text-5xl">
                    How to get your Gemini API key <br />
                  </h2>
                  <p className="text-muted-foreground tracking-tight">
                    <Link
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      className="inline-flex items-center gap-1 text-sm underline"
                    >
                      (visit google ai studio here)
                    </Link>
                  </p>
                </div>

                <div className="group border-secondary bg-secondary/50 hover:border-primary/20 relative aspect-video w-full max-w-4xl overflow-hidden rounded-lg border-4 transition-all">
                  <video
                    src="/onboarding.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover object-[center_22%]"
                  />
                </div>

                <div className="flex w-full flex-col gap-3">
                  <div className="flex w-full gap-4">
                    <Button variant="outline" size="lg" onClick={handleBack}>
                      <ChevronLeft className="size-4" /> Back
                    </Button>
                    <Button size="lg" onClick={handleNext}>
                      I have my key
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex w-full flex-col items-start gap-12 text-left">
                <div className="space-y-4">
                  <h2 className="text-4xl tracking-tight sm:text-5xl">
                    Add your Gemini API key
                  </h2>
                </div>

                <div className="w-full space-y-8">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="max-w-md space-y-8"
                    >
                      <FormField
                        control={form.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center gap-2">
                              <KeyRound className="text-muted-foreground h-4 w-4" />
                              API Key
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showKey ? "text" : "password"}
                                  placeholder="AIza..."
                                  className="bg-secondary/50 focus-visible:ring-primary/20 h-16 rounded-lg border-none px-4 pr-12 font-mono text-lg tracking-wider focus-visible:ring-2"
                                  autoComplete="off"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-foreground absolute top-0 right-2 h-full px-4 py-2 hover:bg-transparent"
                                  onClick={() => setShowKey(!showKey)}
                                >
                                  {showKey ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                  <span className="sr-only">
                                    {showKey ? "Hide API key" : "Show API key"}
                                  </span>
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex w-full gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={handleBack}
                        >
                          <ChevronLeft className="size-4" /> Back
                        </Button>
                        <Button
                          type="submit"
                          size="lg"
                          disabled={!form.watch("apiKey") || isSubmitting}
                        >
                          {isSubmitting ? "Verifying..." : "Save key"}
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="flex w-full flex-col items-start gap-10 text-left">
                <div className="mb-6 space-y-3">
                  <h2 className="text-4xl tracking-tight sm:text-8xl">
                    You&apos;re all set
                  </h2>
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => router.push("/")} size="lg">
                    Start learning
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
