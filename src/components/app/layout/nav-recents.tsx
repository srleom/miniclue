"use client";

import { Plus, MoreHorizontal } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarGroupAction,
} from "@/components/ui/sidebar";
import Link from "next/link";
import NavLecture from "./nav-lecture";
import { ActionResponse } from "@/lib/api/authenticated-api";

export function NavRecents({
  items,
  handleUpdateLectureAccessedAt,
}: {
  items: { name: string; url: string; lectureId: string }[];
  handleUpdateLectureAccessedAt: (
    lectureId: string,
  ) => Promise<ActionResponse<void>>;
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="group/recents hover:bg-sidebar-accent relative flex w-full items-center justify-between pr-1">
        <span>Recents</span>
        <SidebarGroupAction
          asChild
          className="hover:bg-sidebar-border absolute top-1.5 right-1 group-hover/recents:opacity-100 hover:cursor-pointer md:opacity-0"
        >
          <Link href="/">
            <Plus />
            <span className="sr-only">Add content</span>
          </Link>
        </SidebarGroupAction>
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <NavLecture
            key={item.lectureId}
            lecture={{ lecture_id: item.lectureId, title: item.name }}
            isMobile={isMobile}
            handleUpdateLectureAccessedAt={handleUpdateLectureAccessedAt}
          />
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton>
            <MoreHorizontal />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
