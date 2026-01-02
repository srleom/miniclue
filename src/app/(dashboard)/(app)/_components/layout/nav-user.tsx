"use client";

// next
import Link from "next/link";
import { usePathname } from "next/navigation";

// icons
import { CircleUserRound, Cpu, Key, LogOut } from "lucide-react";

// components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// lib
import { getInitials } from "@/lib/utils";
import posthog from "posthog-js";

export function NavUser({
  user,
  handleLogout,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  handleLogout: () => Promise<void>;
}) {
  const pathname = usePathname();

  const handleLogoutWithPostHog = async () => {
    // Reset PostHog first (if initialized)
    if (typeof window !== "undefined" && posthog.__loaded) {
      posthog.reset();
    }

    // Then perform server-side logout
    await handleLogout();
  };

  const settingsLinks = [
    { href: "/settings/profile", icon: CircleUserRound, label: "Profile" },
    { href: "/settings/api-key", icon: Key, label: "API Keys" },
    { href: "/settings/models", icon: Cpu, label: "Models" },
  ];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="hover:cursor-pointer">
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus:ring-0 focus-visible:ring-0"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user.avatar}
                  alt={user.name}
                  className="rounded-full"
                />
                <AvatarFallback className="rounded-full">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={user.avatar}
                    alt={user.name}
                    className="rounded-full"
                  />
                  <AvatarFallback className="rounded-full">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {settingsLinks.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  className="hover:cursor-pointer"
                  asChild
                >
                  <Link
                    href={`${link.href}?returnTo=${encodeURIComponent(pathname)}`}
                  >
                    <link.icon />
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogoutWithPostHog}
              className="hover:cursor-pointer"
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
