import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GalleryVerticalEnd } from "lucide-react";

export default function AuthCodeErrorPage() {
  return (
    <div className="bg-background flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="flex items-center gap-2 self-center font-medium text-xl"
      >
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-4" />
        </div>
        MiniClue
      </Link>
      <div className="mx-auto max-w-sm text-center mt-3">
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
