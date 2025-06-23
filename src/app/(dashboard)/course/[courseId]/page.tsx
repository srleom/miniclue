import { Metadata } from "next";
import { getCourseLectures, getCourseDetails } from "@/app/(dashboard)/actions";
import { DropzoneComponent } from "@/components/app/dashboard/dropzone";
import { Folder } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/app/dashboard/data-table";
import { columns, LectureResponseDTO } from "./columns";

interface CoursePageProps {
  params: { courseId: string };
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { courseId } = await params;
  const courseRes = await getCourseDetails(courseId);
  if (!courseRes.data) {
    return {
      title: "Course not found",
    };
  }
  const { title: courseName } = courseRes.data;

  return {
    title: `${courseName} | MiniClue`,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;

  const courseRes = await getCourseDetails(courseId);
  if (!courseRes.data) {
    return <p>Course not found</p>;
  }
  const { title: courseTitle, is_default: isDefault } = courseRes.data;
  const lecturesDTO = await getCourseLectures(courseId);
  console.log(lecturesDTO);
  const tableLectures: LectureResponseDTO[] =
    lecturesDTO.data?.map((lec) => ({
      lecture_id: lec.lecture_id ?? "",
      title: lec.title ?? "",
      created_at: lec.created_at ?? "",
    })) ?? [];

  console.log("First lecture:", tableLectures[0]);

  return (
    <div className="mx-auto mt-16 flex w-full flex-col items-center lg:w-3xl">
      <div className="mb-7 flex items-center gap-2">
        <Folder />
        <h1 className="text-center text-4xl font-semibold">{courseTitle}</h1>
        {isDefault && <Badge variant="outline">Default</Badge>}
      </div>

      <div className="mb-12 w-full">
        <DropzoneComponent isCoursePage={true} />
      </div>
      <DataTable columns={columns} data={tableLectures} />
    </div>
  );
}
