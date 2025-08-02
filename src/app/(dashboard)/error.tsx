"use client";

// react
import { useEffect } from "react";

// next
import Link from "next/link";

// icons
import { GalleryVerticalEnd } from "lucide-react";

// components
import { Button } from "@/components/ui/button";

// lib
import { logger } from "@/lib/logger";

export default function DashboardErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="flex items-center gap-2 self-center text-xl font-medium"
      >
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-4" />
        </div>
        MiniClue
      </Link>
      <div className="mx-auto mt-3 max-w-sm text-center">
        <h1 className="text-foreground mt-4 text-6xl font-bold tracking-tight sm:text-7xl">
          Oops.
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          There was an issue with your authentication. Please try again.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/auth">Log in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
