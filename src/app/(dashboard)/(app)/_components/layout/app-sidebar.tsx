// next
import Link from "next/link";

// icons
import { Sparkle } from "lucide-react";

// types
import { components } from "@/types/api";
import {
  CourseWithLectures,
  NavRecentsItem,
} from "@/app/(dashboard)/(app)/_types/types";

// lib
import { ActionResponse } from "@/lib/api/authenticated-api";

// components
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavCourses } from "@/app/(dashboard)/(app)/_components/layout/nav-courses";
import { NavPrimary } from "@/app/(dashboard)/(app)/_components/layout/nav-primary";
import { NavRecents } from "@/app/(dashboard)/(app)/_components/layout/nav-recents";
import { NavSecondary } from "@/app/(dashboard)/(app)/_components/layout/nav-secondary";

export function AppSidebar({
  navCourses,
  navRecents,
  createUntitledCourse,
  deleteCourse,
  renameCourse,
  handleUpdateLectureAccessedAt,
  deleteLecture,
  availableCourses = [],
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
  availableCourses?: Array<{ courseId: string; title: string }>;
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
                  className="bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md"
                >
                  <Sparkle className="text-primary-foreground size-4" />
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
          availableCourses={availableCourses}
        />
        <NavRecents
          items={navRecents}
          handleUpdateLectureAccessedAt={handleUpdateLectureAccessedAt}
          deleteLecture={deleteLecture}
          availableCourses={availableCourses}
        />
      </SidebarContent>
      <SidebarFooter className="p-0">
        <NavSecondary />
      </SidebarFooter>
    </Sidebar>
  );
}
