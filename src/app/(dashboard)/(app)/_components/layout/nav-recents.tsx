"use client";

// next
import Link from "next/link";

// icons
import { Plus } from "lucide-react";

// types
import { NavRecentsItem } from "../../_types/types";
import { ActionResponse } from "@/lib/api/authenticated-api";

// components
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import NavLecture from "./nav-lecture";

export function NavRecents({
  items,
  handleUpdateLectureAccessedAt,
  deleteLecture,
  availableCourses = [],
}: {
  items: NavRecentsItem[];
  handleUpdateLectureAccessedAt: (
    lectureId: string,
  ) => Promise<ActionResponse<void>>;
  deleteLecture: (lectureId: string) => Promise<ActionResponse<void>>;
  availableCourses?: Array<{ courseId: string; title: string }>;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="peer group/recents hover:bg-sidebar-accent relative flex w-full items-center justify-between pr-1">
        <span>Recents</span>
        <SidebarGroupAction
          asChild
          className="hover:bg-sidebar-border absolute top-1.5 right-1 group-hover/recents:opacity-100 hover:cursor-pointer data-[state=open]:opacity-100 md:opacity-0"
        >
          <Link href="/" onClick={handleNavigation}>
            <Plus />
            <span className="sr-only">Add content</span>
          </Link>
        </SidebarGroupAction>
      </SidebarGroupLabel>
      <SidebarMenu className="max-h-64 overflow-x-hidden overflow-y-auto">
        {items.map((item) => (
          <NavLecture
            key={item.lectureId}
            lecture={{ lecture_id: item.lectureId, title: item.name }}
            isMobile={isMobile}
            handleUpdateLectureAccessedAt={handleUpdateLectureAccessedAt}
            deleteLecture={deleteLecture}
            availableCourses={availableCourses}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
