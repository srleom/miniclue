"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Presentation, Share } from "lucide-react";
import Link from "next/link";

import { components } from "@/types/api";
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
    cell: () => {
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Presentation className="text-muted-foreground" />
                <span>View Lecture</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="text-muted-foreground" />
                <span>Share Lecture</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Trash2 className="text-muted-foreground" />
                <span>Delete Lecture</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    size: 50,
  },
];
