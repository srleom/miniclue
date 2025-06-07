"use client";

import * as React from "react";
import {
  Folder,
  GalleryVerticalEnd,
  LifeBuoy,
  Presentation,
  Send,
} from "lucide-react";

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

const data = {
  user: {
    name: "srleom",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navCourses: [
    {
      title: "Drafts",
      url: "#",
      icon: Folder,
      isActive: false,
      items: [
        {
          title: "EEE Chapter 1",
          url: "#",
        },
        {
          title: "EEE Chapter 2",
          url: "#",
        },
        {
          title: "EEE Chapter 3",
          url: "#",
        },
      ],
    },
    {
      title: "EEE",
      url: "#",
      icon: Folder,
      isActive: false,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Bioengineering",
      url: "#",
      icon: Folder,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Chemical Engineering",
      url: "#",
      icon: Folder,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
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
  ],
  navRecents: [
    {
      name: "EEE Chapter 1",
      url: "#",
      icon: Presentation,
    },
    {
      name: "EEE Chapter 2",
      url: "#",
      icon: Presentation,
    },
    {
      name: "EEE Chapter 3",
      url: "#",
      icon: Presentation,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavCourses items={data.navCourses} />
        <NavRecents items={data.navRecents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
