"use client";

// components
import { DataTable } from "./data-table";
import { createColumns, LectureResponseDTO } from "./columns";

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
