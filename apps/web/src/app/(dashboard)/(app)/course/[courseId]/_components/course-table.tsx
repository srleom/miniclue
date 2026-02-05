"use client";

// components
import { DataTable } from "./data-table";
import { createColumns } from "./columns";

// types
import type { LectureResponseDTO } from "@/lib/api/generated/types.gen";

interface CourseTableProps {
  data: LectureResponseDTO[];
  currentCourseId: string;
  availableCourses: Array<{ courseId: string; title: string }>;
}

export function CourseTable({
  data,
  currentCourseId,
  availableCourses,
}: CourseTableProps) {
  const columns = createColumns({ currentCourseId, availableCourses });

  return <DataTable columns={columns} data={data} />;
}
