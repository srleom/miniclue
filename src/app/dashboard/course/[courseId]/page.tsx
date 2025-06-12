import { Metadata } from "next";
import { getCourseDetails, getCourseLectures } from "./utils";
import { DropzoneComponent } from "@/components/app/dashboard/dropzone";
import { Folder } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DataTable } from "@/components/app/dashboard/data-table";
import { columns, Lecture } from "./columns";

interface CoursePageProps {
  params: { courseId: string };
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { courseId } = await params;
  const { title: courseName } = await getCourseDetails(courseId);

  return {
    title: `${courseName} | MiniClue`,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;

  const course = await getCourseDetails(courseId);
  const lecturesDTO = await getCourseLectures(courseId);
  const tableLectures: Lecture[] = lecturesDTO.map((lec) => ({
    lectureId: lec.lecture_id ?? "",
    title: lec.title ?? "",
    createdAt: lec.created_at ?? "",
  }));
  if (!course) {
    return <p>Course not found</p>;
  }

  return (
    <div className="mx-auto mt-16 flex w-full flex-col items-center lg:w-3xl">
      <div className="mb-7 flex items-center gap-2">
        <Folder />
        <h1 className="text-center text-4xl font-semibold">{course.title}</h1>
        {course.is_default && <Badge variant="outline">Default</Badge>}
      </div>

      <div className="mb-12 w-full">
        <DropzoneComponent isCoursePage={true} />
      </div>
      <DataTable columns={columns} data={tableLectures} />
    </div>
  );
}
