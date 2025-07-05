"use client";

// types
import { ActionResponse } from "@/lib/api/authenticated-api";

// components
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { ItemActions } from "../item-actions";

//icons
import { Presentation, MoreHorizontal } from "lucide-react";

// code
import { usePathname } from "next/navigation";
import Link from "next/link";
import { updateLecture } from "@/app/(dashboard)/_actions/lecture-actions";

export default function NavLecture({
  lecture,
  isMobile,
  handleUpdateLectureAccessedAt,
  deleteLecture,
}: {
  lecture: { lecture_id: string; title: string };
  isMobile: boolean;
  handleUpdateLectureAccessedAt: (
    lectureId: string,
  ) => Promise<ActionResponse<void>>;
  deleteLecture: (lectureId: string) => Promise<ActionResponse<void>>;
}) {
  const pathname = usePathname();
  const isActive = pathname === `/lecture/${lecture.lecture_id}`;
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
        <Link href={`/lecture/${lecture.lecture_id}`}>
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
      >
        <SidebarMenuAction className="opacity-0 group-hover/lecture:opacity-100">
          <MoreHorizontal />
          <span className="sr-only">More</span>
        </SidebarMenuAction>
      </ItemActions>
    </SidebarMenuItem>
  );
}
