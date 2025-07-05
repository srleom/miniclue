import * as React from "react";
import { GalleryVerticalEnd, LifeBuoy, Send } from "lucide-react";
import { ActionResponse } from "@/lib/api/authenticated-api";

import { NavPrimary } from "./nav-primary";
import { NavCourses } from "./nav-courses";
import { NavRecents } from "./nav-recents";
import { NavSecondary } from "./nav-secondary";
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
import { components } from "@/types/api";
import { CourseWithLectures, NavRecentsItem } from "../../_types/types";

export function AppSidebar({
  navCourses,
  navRecents,
  createUntitledCourse,
  deleteCourse,
  renameCourse,
  handleUpdateLectureAccessedAt,
  deleteLecture,
  ...props
}: {
  navCourses: CourseWithLectures[];
  navRecents: NavRecentsItem[];
  createUntitledCourse: () => Promise<
    ActionResponse<
      components["schemas"]["app_internal_api_v1_dto.CourseResponseDTO"]
    >
  >;
  deleteCourse: (courseId: string) => Promise<ActionResponse<void>>;
  renameCourse: (
    courseId: string,
    title: string,
  ) => Promise<
    ActionResponse<
      components["schemas"]["app_internal_api_v1_dto.CourseResponseDTO"]
    >
  >;
  handleUpdateLectureAccessedAt: (
    lectureId: string,
  ) => Promise<ActionResponse<void>>;
  deleteLecture: (lectureId: string) => Promise<ActionResponse<void>>;
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
                  href="/"
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
        <NavCourses
          items={navCourses}
          createUntitledCourse={createUntitledCourse}
          deleteCourse={deleteCourse}
          renameCourse={renameCourse}
          handleUpdateLectureAccessedAt={handleUpdateLectureAccessedAt}
          deleteLecture={deleteLecture}
        />
        <NavRecents
          items={navRecents}
          handleUpdateLectureAccessedAt={handleUpdateLectureAccessedAt}
          deleteLecture={deleteLecture}
        />
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
