"use client";

// next
import Link from "next/link";
import { usePathname } from "next/navigation";

// icons
import { ChevronLeft, CircleUserRound } from "lucide-react";

// components
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavSecondary } from "../../(app)/_components/layout/nav-secondary";

export function SettingsSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile, isMobile } = useSidebar();
  const pathname = usePathname();

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="default" variant="default" asChild>
              <Link href="/" onClick={handleNavigation}>
                <ChevronLeft />
                Back to app
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="mt-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="default"
                variant="default"
                className={
                  pathname === "/settings/profile"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : undefined
                }
              >
                <Link href="/settings/profile" onClick={handleNavigation}>
                  <CircleUserRound />
                  Profile
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-0">
        <NavSecondary />
      </SidebarFooter>
    </Sidebar>
  );
}
