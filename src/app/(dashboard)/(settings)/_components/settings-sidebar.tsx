"use client";

// next
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

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
  const { setOpenMobile, isMobile } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const navItems = [
    { href: "/settings/profile", icon: CircleUserRound, label: "Profile" },
    { href: "/settings/api-key", icon: Key, label: "API Keys" },
    { href: "/settings/models", icon: Cpu, label: "Models" },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="default" variant="default" asChild>
              <Link href={returnTo} onClick={handleNavigation}>
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
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  size="default"
                  variant="default"
                  className={
                    pathname === item.href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : undefined
                  }
                >
                  <Link
                    href={`${item.href}?returnTo=${encodeURIComponent(returnTo)}`}
                    onClick={handleNavigation}
                    replace
                  >
                    <item.icon />
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-0">
        <NavSecondary />
      </SidebarFooter>
    </Sidebar>
  );
}
