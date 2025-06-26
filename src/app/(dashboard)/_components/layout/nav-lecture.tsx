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
import { ActionResponse } from "@/lib/api/authenticated-api";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import DeleteDialog from "../delete-dialog";

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
          <DeleteDialog
            title="Are you sure you want to delete this lecture?"
            description="This will permanently delete the lecture and all associated data. This action cannot be undone."
            onConfirm={async () => {
              const toastId = toast.loading(`Deleting lecture...`);
              let result;
              try {
                result = await deleteLecture(lecture.lecture_id);
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
              <span>Delete lecture</span>
            </DropdownMenuItem>
          </DeleteDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
