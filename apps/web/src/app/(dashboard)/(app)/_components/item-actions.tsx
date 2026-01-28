"use client";

// react
import * as React from "react";
import { useState } from "react";

// third-party
import { toast } from "sonner";

// icons
import { Pencil, Trash2, FolderOpen } from "lucide-react";

// types
import { ActionResponse } from "@/lib/api/authenticated-api";

// components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteDialog from "./delete-dialog";
import { RenameDialog } from "./rename-dialog";
import { RenameForm } from "./rename-form";

// code
import { moveLecture } from "@/app/(dashboard)/(app)/_actions/lecture-actions";

type Item = {
  id: string;
  title: string;
};

interface ItemActionsProps<T> {
  item: Item;
  itemType: "course" | "lecture";
  renameAction: (id: string, title: string) => Promise<ActionResponse<T>>;
  deleteAction: (id: string) => Promise<ActionResponse<void>>;
  children: React.ReactNode;
  isDefault?: boolean;
  dropdownMenuContentProps?: React.ComponentProps<typeof DropdownMenuContent>;
  onDeleteSuccess?: () => void;
  // For lecture move functionality
  currentCourseId?: string;
  availableCourses?: Array<{ courseId: string; title: string }>;
}

export function ItemActions<T>({
  item,
  itemType,
  renameAction,
  deleteAction,
  children,
  isDefault = false,
  dropdownMenuContentProps,
  onDeleteSuccess,
  currentCourseId,
  availableCourses = [],
}: ItemActionsProps<T>) {
  const [openMenu, setOpenMenu] = useState(false);

  // Show all courses but identify the current one for disabling
  const moveTargetCourses = availableCourses
    .map((course) => {
      const courseId = String(course.courseId || "");
      const currentId = String(currentCourseId || "");
      return {
        ...course,
        isCurrentCourse: courseId === currentId,
      };
    })
    .sort((a, b) => {
      // Sort current course to the top
      if (a.isCurrentCourse && !b.isCurrentCourse) return -1;
      if (!a.isCurrentCourse && b.isCurrentCourse) return 1;
      return 0;
    });

  const handleMoveLecture = async (
    targetCourseId: string,
    targetCourseTitle: string,
  ) => {
    // Validate inputs
    if (!targetCourseId || targetCourseId.trim() === "") {
      toast.error("Invalid target course");
      return;
    }

    if (!item.id || item.id.trim() === "") {
      toast.error("Invalid lecture");
      return;
    }

    const toastId = toast.loading(
      `Moving lecture to "${targetCourseTitle}"...`,
    );
    try {
      const result = await moveLecture(item.id, targetCourseId);
      if (result?.error) {
        toast.error(result.error as string);
      } else {
        toast.success(`Lecture moved to "${targetCourseTitle}"`);
      }
    } catch {
      toast.error("Failed to move lecture");
    } finally {
      toast.dismiss(toastId);
      setOpenMenu(false);
    }
  };

  return (
    <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent {...dropdownMenuContentProps}>
        <RenameDialog
          onOpenChange={(open) => !open && setOpenMenu(false)}
          trigger={
            <DropdownMenuItem
              className="hover:cursor-pointer"
              onSelect={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="text-muted-foreground" />
              <span>Rename {itemType}</span>
            </DropdownMenuItem>
          }
          title={`Rename ${itemType}`}
          form={
            <RenameForm
              id={item.id}
              defaultValue={item.title}
              action={renameAction}
              successMessage={`${
                itemType.charAt(0).toUpperCase() + itemType.slice(1)
              } renamed`}
              onSuccess={() => {
                setOpenMenu(false);
              }}
            />
          }
        />

        {/* Move to Course option - only for lectures */}
        {itemType === "lecture" && moveTargetCourses.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                className="hover:cursor-pointer"
                onSelect={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
              >
                <FolderOpen className="text-muted-foreground mr-2 h-4 w-4" />
                <span>Move to Course</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {moveTargetCourses.map((course) => (
                  <DropdownMenuItem
                    key={course.courseId}
                    className={`${
                      course.isCurrentCourse
                        ? "text-muted-foreground cursor-not-allowed opacity-50"
                        : "hover:cursor-pointer"
                    }`}
                    onSelect={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!course.isCurrentCourse) {
                        handleMoveLecture(course.courseId, course.title);
                      }
                    }}
                    disabled={course.isCurrentCourse}
                  >
                    {course.title}
                    {course.isCurrentCourse && " (Current)"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

        {!isDefault && (
          <>
            <DropdownMenuSeparator />
            <DeleteDialog
              onOpenChange={(open) => !open && setOpenMenu(false)}
              title={`Are you sure you want to delete this ${itemType}?`}
              description="This action cannot be undone."
              onConfirm={async () => {
                const toastId = toast.loading(`Deleting ${itemType}...`);
                try {
                  const result = await deleteAction(item.id);
                  if (result?.error) {
                    toast.error(result.error as string);
                  } else {
                    onDeleteSuccess?.();
                  }
                } finally {
                  toast.dismiss(toastId);
                  setOpenMenu(false);
                }
              }}
            >
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 hover:cursor-pointer"
                onSelect={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="text-destructive" />
                <span>Delete {itemType}</span>
              </DropdownMenuItem>
            </DeleteDialog>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
