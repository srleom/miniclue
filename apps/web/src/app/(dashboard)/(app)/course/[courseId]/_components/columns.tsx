"use client";

// next
import Link from "next/link";

// third-party
import { ColumnDef } from "@tanstack/react-table";

// icons
import { MoreHorizontal } from "lucide-react";

// types
import type { LectureResponseDTO } from "@/lib/api/generated/types.gen";

// components
import { ItemActions } from "@/app/(dashboard)/(app)/_components/item-actions";
import { Button } from "@/components/ui/button";

// lib
import { formatDate } from "@/lib/utils";

// code
import {
  deleteLecture,
  updateLecture,
} from "@/app/(dashboard)/(app)/_actions/lecture-actions";

// LectureResponseDTO is imported from generated types

interface ColumnsProps {
  currentCourseId: string;
  availableCourses: Array<{ courseId: string; title: string }>;
}

export const createColumns = ({
  currentCourseId,
  availableCourses,
}: ColumnsProps): ColumnDef<LectureResponseDTO>[] => [
  {
    accessorKey: "title",
    header: "Title",
    cell: (info) => (
      <Link
        href={`/lecture/${info.row.original.lecture_id}`}
        className="block h-full w-full"
      >
        {info.getValue<string>()}
      </Link>
    ),
    size: 350,
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: (info) => {
      const raw = info.row.original.created_at;
      return (
        <Link
          href={`/lecture/${info.row.original.lecture_id}`}
          className="block h-full w-full"
        >
          {formatDate(raw)}
        </Link>
      );
    },
    size: 200,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lecture = row.original;
      return (
        <div className="flex justify-end">
          <ItemActions
            item={{ id: lecture.lecture_id!, title: lecture.title! }}
            itemType="lecture"
            renameAction={updateLecture}
            deleteAction={deleteLecture}
            dropdownMenuContentProps={{ align: "end" }}
            currentCourseId={currentCourseId}
            availableCourses={availableCourses}
          >
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </ItemActions>
        </div>
      );
    },
    size: 50,
  },
];
