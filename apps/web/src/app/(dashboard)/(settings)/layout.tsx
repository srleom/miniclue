// next
import { Suspense } from "react";

// components
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// code
import { SettingsSidebar } from "./_components/settings-sidebar";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden">
      <SidebarProvider defaultOpen={true}>
        <Suspense>
          <SettingsSidebar />
        </Suspense>
        <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col md:px-15">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
