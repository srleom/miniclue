"use client";

// react
import * as React from "react";

// icons
import { Folder, Pencil } from "lucide-react";

// components
import { RenameDialog } from "@/app/(dashboard)/(app)/_components/rename-dialog";
import { RenameForm } from "@/app/(dashboard)/(app)/_components/rename-form";
import { Badge } from "@/components/ui/badge";

// code
import { updateCourse } from "@/app/(dashboard)/(app)/_actions/course-actions";

export interface CourseHeaderProps {
  courseId: string;
  courseTitle: string;
  isDefault: boolean;
}

export default function CourseHeader({
  courseId,
  courseTitle,
  isDefault,
}: CourseHeaderProps) {
  return (
    <div className="group mb-7 flex items-center gap-2">
      <Folder />
      <h1 className="text-center text-4xl font-semibold">{courseTitle}</h1>
      {isDefault && <Badge variant="outline">Default</Badge>}
      {!isDefault && (
        <RenameDialog
          trigger={
            <button
              type="button"
              className="text-muted-foreground ml-2 cursor-pointer opacity-100 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <Pencil size={20} />
            </button>
          }
          title="Rename course"
          form={
            <RenameForm
              id={courseId}
              defaultValue={courseTitle}
              action={updateCourse}
              successMessage="Course renamed"
            />
          }
        />
      )}
    </div>
  );
}
