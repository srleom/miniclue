"use client";

// react
import * as React from "react";
import { useState } from "react";

// types
import { CourseWithLectures } from "../../_types/types";
import { components } from "@/types/api";
import { ActionResponse } from "@/lib/api/authenticated-api";

// components
import { RenameDialog } from "../rename-dialog";
import { Input } from "@/components/ui/input";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import DeleteDialog from "../delete-dialog";
import { toast } from "sonner";

//icons
import {
  ChevronRight,
  Folder,
  Pencil,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";

//code
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavCourses({
  items,
  createUntitledCourse,
  deleteCourse,
  renameCourse,
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
}) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  // control dropdown menu open state per course
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
                <div className="group/collapsible relative flex items-center justify-between">
                  <CollapsibleTrigger asChild>
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
                  </CollapsibleTrigger>
                  {!item.isDefault && (
                    <DropdownMenu
                      open={openMenuId === item.courseId}
                      onOpenChange={(isOpen) =>
                        setOpenMenuId(isOpen ? item.courseId! : null)
                      }
                    >
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
                        <RenameDialog
                          onOpenChange={(open) => {
                            if (!open) setOpenMenuId(null);
                          }}
                          trigger={
                            <DropdownMenuItem
                              className="hover:cursor-pointer"
                              onSelect={(e) => e.preventDefault()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Pencil className="text-muted-foreground" />
                              <span>Rename course</span>
                            </DropdownMenuItem>
                          }
                          title="Rename course"
                          form={
                            <form
                              action={async (formData: FormData) => {
                                const name = formData.get("name") as string;
                                const result = await renameCourse(
                                  item.courseId!,
                                  name,
                                );
                                if (result.error) {
                                  toast.error(result.error);
                                } else {
                                  toast.success("Course renamed");
                                }
                              }}
                              className="grid gap-4"
                            >
                              <div className="grid gap-3">
                                <Input
                                  id={`course-name-${item.courseId}`}
                                  name="name"
                                  defaultValue={item.title}
                                />
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button
                                    variant="outline"
                                    className="cursor-pointer"
                                  >
                                    Cancel
                                  </Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button
                                    type="submit"
                                    className="cursor-pointer"
                                  >
                                    Save
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </form>
                          }
                        />
                        <DropdownMenuSeparator />
                        <DeleteDialog
                          onOpenChange={(open) => {
                            if (!open) setOpenMenuId(null);
                          }}
                          title="Are you sure you want to delete this course?"
                          description="This will permanently delete all lectures and all associated data. This action cannot be undone."
                          onConfirm={async () => {
                            const toastId = toast.loading(`Deleting course...`);
                            let result;
                            try {
                              result = await deleteCourse(item.courseId!);
                            } finally {
                              toast.dismiss(toastId);
                            }
                            if (result?.error) {
                              toast.error(result.error);
                            }
                            // also close the menu after confirm
                            setOpenMenuId(null);
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
                      </DropdownMenuContent>
                    </DropdownMenu>
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
