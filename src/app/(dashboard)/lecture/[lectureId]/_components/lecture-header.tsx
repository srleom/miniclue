"use client";

import * as React from "react";
import { BreadcrumbPage } from "@/components/ui/breadcrumb";
import { RenameDialog } from "@/app/(dashboard)/_components/rename-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { updateLecture } from "@/app/(dashboard)/_actions/lecture-actions";
import { toast } from "sonner";

export interface LectureHeaderProps {
  lectureId: string;
  lectureTitle: string;
}

export default function LectureHeader({
  lectureId,
  lectureTitle,
}: LectureHeaderProps) {
  return (
    <div className="group inline-flex items-center gap-1">
      <BreadcrumbPage>{lectureTitle}</BreadcrumbPage>
      <RenameDialog
        trigger={
          <button
            type="button"
            className="text-muted-foreground ml-1 cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <Pencil size={12} />
          </button>
        }
        title="Rename lecture"
        form={
          <form
            action={async (formData: FormData) => {
              const name = formData.get("name") as string;
              const result = await updateLecture(lectureId, name);
              if (result.error) {
                toast.error(result.error);
              } else {
                toast.success("Lecture renamed");
              }
            }}
            className="grid gap-4"
          >
            <div className="grid gap-3">
              <Input
                id={`lecture-name-${lectureId}`}
                name="name"
                defaultValue={lectureTitle}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="cursor-pointer">
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button type="submit" className="cursor-pointer">
                  Save
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        }
      />
    </div>
  );
}
