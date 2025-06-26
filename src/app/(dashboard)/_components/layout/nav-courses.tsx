"use client";

import {
  ChevronRight,
  Folder,
  Forward,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ActionResponse } from "@/lib/api/authenticated-api";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NavLecture from "./nav-lecture";
import { components } from "@/types/api";
import DeleteDialog from "../delete-dialog";
import { CourseWithLectures } from "../../_types/types";

export function NavCourses({
  items,
  createUntitledCourse,
  deleteCourse,
  handleUpdateLectureAccessedAt,
  deleteLecture,
}: {
  items: CourseWithLectures[];
  createUntitledCourse: () => Promise<
    ActionResponse<
      components["schemas"]["app_internal_api_v1_dto.CourseResponseDTO"]
    >
  >;
  deleteCourse: (courseId: string) => Promise<ActionResponse<void>>;
  handleUpdateLectureAccessedAt: (
    lectureId: string,
  ) => Promise<ActionResponse<void>>;
  deleteLecture: (lectureId: string) => Promise<ActionResponse<void>>;
}) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

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
      <SidebarMenu>
        {sortedItems.map((item) =>
          item.courseId && item.title ? (
            <SidebarMenuItem key={item.courseId}>
              <Collapsible defaultOpen={item.isActive}>
                <CollapsibleTrigger asChild className="group/collapsible">
                  <div>
                    <SidebarMenuButton
                      className={
                        pathname === `/course/${item.courseId}`
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : undefined
                      }
                    >
                      <ChevronRight className="hidden transition-transform group-hover/collapsible:block group-data-[state=open]/collapsible:rotate-90" />
                      <Folder className="group-hover/collapsible:hidden" />
                      <Link
                        href={`/course/${item.courseId}`}
                        className="w-full truncate"
                      >
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction className="opacity-0 group-hover/collapsible:opacity-100">
                          <MoreHorizontal />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-48 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align={isMobile ? "end" : "start"}
                      >
                        <DropdownMenuItem
                          className="hover:cursor-pointer"
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Folder className="text-muted-foreground" />
                          <span>View course</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="hover:cursor-pointer"
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Forward className="text-muted-foreground" />
                          <span>Share course</span>
                        </DropdownMenuItem>
                        {!item.isDefault ? (
                          <>
                            <DropdownMenuSeparator />
                            <DeleteDialog
                              title="Are you sure you want to delete this course?"
                              description="This will permanently delete all lectures and all associated data. This action cannot be undone."
                              onConfirm={async () => {
                                const toastId =
                                  toast.loading(`Deleting course...`);
                                let result;
                                try {
                                  result = await deleteCourse(item.courseId!);
                                } finally {
                                  toast.dismiss(toastId);
                                }
                                if (result?.error) {
                                  toast.error(result.error);
                                }
                              }}
                            >
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 hover:cursor-pointer"
                                onSelect={(e) => e.preventDefault()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="text-destructive" />
                                <span>Delete course</span>
                              </DropdownMenuItem>
                            </DeleteDialog>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CollapsibleTrigger>
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
