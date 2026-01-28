// next
import Link from "next/link";

// components
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

// icons
import { ChevronLeft } from "lucide-react";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 md:hidden">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 hover:cursor-pointer" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="text-muted-foreground -ml-3 px-0">
              <ChevronLeft className="size-4" />
              Back to app
            </Link>
          </Button>
        </div>
      </header>
      <div className="mx-auto flex w-full flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0 pb-20">
        {children}
      </div>
    </>
  );
}
