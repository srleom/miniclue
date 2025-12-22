"use client";

// next
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// icons
import { ChevronLeft, CircleUserRound, Key, Cpu } from "lucide-react";

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
  const router = useRouter();
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
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  router.back();
                  handleNavigation();
                }}
              >
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
                <Link
                  href="/settings/profile"
                  onClick={handleNavigation}
                  replace
                >
                  <CircleUserRound />
                  Profile
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="default"
                variant="default"
                className={
                  pathname === "/settings/api-key"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : undefined
                }
              >
                <Link
                  href="/settings/api-key"
                  onClick={handleNavigation}
                  replace
                >
                  <Key />
                  API Keys
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="default"
                variant="default"
                className={
                  pathname === "/settings/models"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : undefined
                }
              >
                <Link
                  href="/settings/models"
                  onClick={handleNavigation}
                  replace
                >
                  <Cpu />
                  Models
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
