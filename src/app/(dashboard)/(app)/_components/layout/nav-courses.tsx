"use client";

// react
import * as React from "react";

// types
import { CourseWithLectures } from "../../_types/types";
import { components } from "@/types/api";
import { ActionResponse } from "@/lib/api/authenticated-api";

// components
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from "@/components/ui/sidebar";
import NavLecture from "./nav-lecture";
import { toast } from "sonner";

//icons
import { ChevronRight, Folder, MoreHorizontal, Plus } from "lucide-react";

//code
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ItemActions } from "@/app/(dashboard)/(app)/_components/item-actions";

export function NavCourses({
  items,
  createUntitledCourse,
  deleteCourse,
  renameCourse,
  handleUpdateLectureAccessedAt,
  deleteLecture,
  availableCourses = [],
}: {
  items: CourseWithLectures[];
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
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const defaultCourse = items.find((item) => item.isDefault);
  const otherCourses = items.filter((item) => !item.isDefault);

  const sortedItems = defaultCourse ? [defaultCourse, ...otherCourses] : items;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="peer group/courses hover:bg-sidebar-accent relative flex w-full items-center justify-between pr-1">
        <span>Courses</span>
        <SidebarGroupAction
          className="hover:bg-sidebar-border absolute top-1.5 right-1 group-hover/courses:opacity-100 hover:cursor-pointer data-[state=open]:opacity-100 md:opacity-0"
          onClick={async () => {
            const result = await createUntitledCourse();
            if (result.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Course created");
          }}
        >
          <Plus />
          <span className="sr-only">Add course</span>
        </SidebarGroupAction>
      </SidebarGroupLabel>
      <SidebarMenu className="max-h-64 overflow-x-hidden overflow-y-auto">
        {sortedItems.map((item) =>
          item.courseId && item.title ? (
            <SidebarMenuItem key={item.courseId}>
              <Collapsible defaultOpen={item.isActive}>
                <div className="group/collapsible relative flex items-center justify-between">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={
                        pathname === `/course/${item.courseId}`
                          ? "bg-sidebar-accent text-sidebar-accent-foreground group"
                          : "group"
                      }
                    >
                      <ChevronRight className="block transition-transform group-hover/collapsible:block group-data-[state=open]:rotate-90 md:hidden" />
                      <Folder className="hidden group-hover/collapsible:hidden md:block" />
                      <Link
                        href={`/course/${item.courseId}`}
                        className="w-full truncate"
                        onClick={handleNavigation}
                      >
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!item.isDefault && (
                    <ItemActions
                      item={{ id: item.courseId, title: item.title }}
                      itemType="course"
                      renameAction={renameCourse}
                      deleteAction={deleteCourse}
                      isDefault={item.isDefault}
                      dropdownMenuContentProps={{
                        className: "w-48 rounded-lg",
                        side: isMobile ? "bottom" : "right",
                        align: isMobile ? "end" : "start",
                      }}
                    >
                      <SidebarMenuAction className="opacity-100 md:opacity-0 md:group-hover/collapsible:opacity-100">
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </ItemActions>
                  )}
                </div>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.lectures.length > 0 ? (
                      item.lectures.map((lecture) => (
                        <NavLecture
                          key={lecture.lecture_id}
                          lecture={lecture}
                          isMobile={isMobile}
                          handleUpdateLectureAccessedAt={
                            handleUpdateLectureAccessedAt
                          }
                          deleteLecture={deleteLecture}
                          currentCourseId={item.courseId}
                          availableCourses={availableCourses}
                        />
                      ))
                    ) : (
                      <SidebarMenuItem>
                        <span className="text-muted-foreground p-2 text-sm">
                          No lectures found.
                        </span>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          ) : null,
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
