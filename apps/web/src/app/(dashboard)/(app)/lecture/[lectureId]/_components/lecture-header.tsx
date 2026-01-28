"use client";

// components
import { BreadcrumbPage } from "@/components/ui/breadcrumb";
import { RenameDialog } from "@/app/(dashboard)/(app)/_components/rename-dialog";
import { RenameForm } from "@/app/(dashboard)/(app)/_components/rename-form";

// icons
import { Pencil } from "lucide-react";

// code
import { updateLecture } from "@/app/(dashboard)/(app)/_actions/lecture-actions";

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
            className="text-muted-foreground ml-1 cursor-pointer opacity-100 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
          >
            <Pencil size={12} />
          </button>
        }
        title="Rename lecture"
        form={
          <RenameForm
            id={lectureId}
            defaultValue={lectureTitle}
            action={updateLecture}
            successMessage="Lecture renamed"
          />
        }
      />
    </div>
  );
}
