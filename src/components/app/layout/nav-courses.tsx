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
import { truncateString } from "@/lib/utils";
import {
  getCourseLectures,
  handleUpdateLectureAccessedAt,
} from "@/app/actions";
import { useState } from "react";
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
import { createUntitledCourse, deleteCourse } from "@/app/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NavLecture from "./nav-lecture";

export function NavCourses({
  items,
}: {
  items: {
    title: string;
    url: string;
    courseId: string;
    isDefault: boolean;
    isActive?: boolean;
  }[];
}) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  const [lecturesMap, setLecturesMap] = useState<
    Record<string, { lecture_id: string; title: string }[]>
  >({});

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
            const { error } = await createUntitledCourse();
            if (error) {
              toast.error("Failed to create course");
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
        {sortedItems.map((item) => (
          <SidebarMenuItem key={item.courseId}>
            <Collapsible
              defaultOpen={item.isActive}
              onOpenChange={(open) => {
                if (open && !lecturesMap[item.courseId]) {
                  getCourseLectures(item.courseId).then((res) => {
                    if (!res.error) {
                      setLecturesMap((prev) => ({
                        ...prev,
                        [item.courseId]: (res.data || []).filter(
                          (
                            lecture,
                          ): lecture is { lecture_id: string; title: string } =>
                            lecture.lecture_id !== undefined &&
                            lecture.title !== undefined,
                        ),
                      }));
                    }
                  });
                }
              }}
            >
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
                    <Link href={`/course/${item.courseId}`} className="w-full">
                      {truncateString(item.title, 20)}
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="hover:cursor-pointer"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={async (e) => {
                          e.stopPropagation();
                          const { error } = await deleteCourse(item.courseId);
                          if (error) {
                            toast.error(error);
                            return;
                          }
                          toast.success("Course deleted");
                        }}
                      >
                        <Trash2 className="text-muted-foreground" />
                        <span>Delete course</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {(lecturesMap[item.courseId] || []).map((lecture) => (
                    <NavLecture
                      key={lecture.lecture_id}
                      lecture={lecture}
                      isMobile={isMobile}
                      handleUpdateLectureAccessedAt={
                        handleUpdateLectureAccessedAt
                      }
                    />
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
