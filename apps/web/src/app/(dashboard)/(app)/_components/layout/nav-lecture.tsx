"use client";

// next
import Link from "next/link";
import { usePathname } from "next/navigation";

// components
import { ItemActions } from "../item-actions";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// icons
import { MoreHorizontal, Presentation } from "lucide-react";

// types
import { ActionResponse } from "@/lib/api/authenticated-api";

// code
import { updateLecture } from "@/app/(dashboard)/(app)/_actions/lecture-actions";

export default function NavLecture({
  lecture,
  isMobile,
  handleUpdateLectureAccessedAt,
  deleteLecture,
  availableCourses = [],
  currentCourseId,
}: {
  lecture: { lecture_id: string; title: string };
  isMobile: boolean | undefined;
  handleUpdateLectureAccessedAt: (
    lectureId: string,
  ) => Promise<ActionResponse<void>>;
  deleteLecture: (lectureId: string) => Promise<ActionResponse<void>>;
  availableCourses?: Array<{ courseId: string; title: string }>;
  currentCourseId?: string;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const isActive = pathname === `/lecture/${lecture.lecture_id}`;

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenuItem key={lecture.lecture_id} className="group/lecture">
      <SidebarMenuButton
        asChild
        className={
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : undefined
        }
        onClick={async () =>
          await handleUpdateLectureAccessedAt(lecture.lecture_id)
        }
      >
        <Link
          href={`/lecture/${lecture.lecture_id}`}
          onClick={handleNavigation}
        >
          <Presentation />
          <span>{lecture.title}</span>
        </Link>
      </SidebarMenuButton>
      <ItemActions
        item={{ id: lecture.lecture_id, title: lecture.title }}
        itemType="lecture"
        renameAction={updateLecture}
        deleteAction={deleteLecture}
        dropdownMenuContentProps={{
          className: "w-48",
          side: isMobile ? "bottom" : "right",
          align: isMobile ? "end" : "start",
        }}
        currentCourseId={currentCourseId}
        availableCourses={availableCourses}
      >
        <SidebarMenuAction className="opacity-100 md:opacity-0 md:group-hover/lecture:opacity-100">
          <MoreHorizontal />
          <span className="sr-only">More</span>
        </SidebarMenuAction>
      </ItemActions>
    </SidebarMenuItem>
  );
}
