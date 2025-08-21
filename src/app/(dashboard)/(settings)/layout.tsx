// next

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
        <SettingsSidebar />
        <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
