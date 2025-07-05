"use client";

import * as React from "react";
import { Folder, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RenameDialog } from "@/app/(dashboard)/_components/rename-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { updateCourse } from "@/app/(dashboard)/_actions/course-actions";
import { toast } from "sonner";

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
              className="text-muted-foreground ml-2 cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <Pencil size={20} />
            </button>
          }
          title="Rename course"
          form={
            <form
              action={async (formData: FormData) => {
                const name = formData.get("name") as string;
                const result = await updateCourse(courseId, name);
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
                  id={`course-name-${courseId}`}
                  name="name"
                  defaultValue={courseTitle}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type="submit">Save</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          }
        />
      )}
    </div>
  );
}
