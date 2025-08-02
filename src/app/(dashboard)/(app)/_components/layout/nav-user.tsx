"use client";

// next
import Link from "next/link";

// icons
import {
  CircleUserRound,
  CreditCard,
  LoaderCircle,
  LogOut,
  Sparkles,
} from "lucide-react";

// components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { getInitials, isPaidUser, getPlanDisplayName } from "@/lib/utils";

// types
import type { components } from "@/types/api";

type SubscriptionData =
  components["schemas"]["app_internal_api_v1_dto.SubscriptionResponseDTO"];

export function NavUser({
  user,
  subscription,
  handleLogout,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  subscription?: SubscriptionData;
  handleLogout: () => Promise<void>;
}) {
  // Determine if user is on a paid plan
  const isPaid = isPaidUser(subscription);
  const planDisplayName = getPlanDisplayName(subscription);

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
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{user.name}</span>
                    <Badge variant="secondary" className="px-2 py-0 text-xs">
                      {planDisplayName}
                    </Badge>
                  </div>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {process.env.NEXT_PUBLIC_SHOW_PRICING_PLANS === "true" &&
              !isPaid && (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="hover:cursor-pointer" asChild>
                      <Link href="/settings/subscription">
                        <Sparkles />
                        Upgrade to Pro
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </>
              )}
            <DropdownMenuGroup>
              <DropdownMenuItem className="hover:cursor-pointer" asChild>
                <Link href="/settings/profile">
                  <CircleUserRound />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:cursor-pointer" asChild>
                <Link href="/settings/subscription">
                  <CreditCard />
                  Subscription
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:cursor-pointer" asChild>
                <Link href="/settings/usage">
                  <LoaderCircle />
                  Usage
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
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
