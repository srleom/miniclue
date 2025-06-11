"use client";

import * as React from "react";
import { GalleryVerticalEnd, LifeBuoy, Send } from "lucide-react";

import { NavPrimary } from "@/components/app/layout/nav-primary";
import { NavCourses } from "@/components/app/layout/nav-courses";
import { NavRecents } from "@/components/app/layout/nav-recents";
import { NavSecondary } from "@/components/app/layout/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import Link from "next/link";

export function AppSidebar({
  navCourses,
  navRecents,
  ...props
}: {
  navCourses: {
    title: string;
    url: string;
    courseId: string;
    isDefault: boolean;
    isActive?: boolean;
    items?: { title: string; url: string }[];
  }[];
  navRecents: {
    name: string;
    url: string;
  }[];
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-transparent hover:text-inherit active:bg-transparent active:text-inherit"
            >
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                >
                  <GalleryVerticalEnd className="size-4" />
                </Link>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavPrimary />
        <NavCourses items={navCourses} />
        <NavRecents items={navRecents} />
        <NavSecondary
          items={[
            {
              title: "Support",
              url: "#",
              icon: LifeBuoy,
            },
            {
              title: "Feedback",
              url: "#",
              icon: Send,
            },
          ]}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
