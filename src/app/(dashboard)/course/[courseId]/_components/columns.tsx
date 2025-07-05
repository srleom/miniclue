"use client";

// next
import Link from "next/link";

// third-party
import { ColumnDef } from "@tanstack/react-table";

// icons
import { MoreHorizontal } from "lucide-react";

// types
import { components } from "@/types/api";

// components
import { ItemActions } from "@/app/(dashboard)/_components/item-actions";
import { Button } from "@/components/ui/button";

// code
import {
  deleteLecture,
  updateLecture,
} from "@/app/(dashboard)/_actions/lecture-actions";

export type LectureResponseDTO =
  components["schemas"]["app_internal_api_v1_dto.LectureResponseDTO"];

export const columns: ColumnDef<LectureResponseDTO>[] = [
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
      if (!raw) return "Unknown date";

      const date = new Date(raw);
      const formatted = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
      return (
        <Link
          href={`/lecture/${info.row.original.lecture_id}`}
          className="block h-full w-full"
        >
          {formatted}
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
