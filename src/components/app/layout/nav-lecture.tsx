import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Presentation, MoreHorizontal, Share, Trash2 } from "lucide-react";
import { ActionResponse } from "@/app/actions";

export default function NavLecture({
  lecture,
  isMobile,
  handleUpdateLectureAccessedAt,
}: {
  lecture: { lecture_id: string; title: string };
  isMobile: boolean;
  handleUpdateLectureAccessedAt: (
    lectureId: string,
  ) => Promise<ActionResponse<void>>;
}) {
  return (
    <SidebarMenuItem key={lecture.lecture_id} className="group/lecture">
      <SidebarMenuButton
        asChild
        onClick={async () =>
          await handleUpdateLectureAccessedAt(lecture.lecture_id)
        }
      >
        <Link href={`/lecture/${lecture.lecture_id}`}>
          <Presentation />
          <span>{lecture.title}</span>
        </Link>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction className="opacity-0 group-hover/lecture:opacity-100">
            <MoreHorizontal />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-48"
          side={isMobile ? "bottom" : "right"}
          align={isMobile ? "end" : "start"}
        >
          <DropdownMenuItem
            className="hover:cursor-pointer"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Presentation className="text-muted-foreground" />
            <span>View Lecture</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:cursor-pointer"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Share className="text-muted-foreground" />
            <span>Share Lecture</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="hover:cursor-pointer"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="text-muted-foreground" />
            <span>Delete Lecture</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
