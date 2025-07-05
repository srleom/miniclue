import { Metadata } from "next";
import {
  getCourseLectures,
  getCourseDetails,
} from "@/app/(dashboard)/_actions/course-actions";
import { DropzoneComponent } from "@/app/(dashboard)/_components/dropzone";
import { DataTable } from "@/app/(dashboard)/course/[courseId]/_components/data-table";
import {
  columns,
  LectureResponseDTO,
} from "@/app/(dashboard)/course/[courseId]/_components/columns";
import { uploadLectures } from "@/app/(dashboard)/_actions/lecture-actions";
import CourseHeader from "./_components/course-header";

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
  const tableLectures: LectureResponseDTO[] =
    lecturesDTO.data?.map((lec) => ({
      lecture_id: lec.lecture_id ?? "",
      title: lec.title ?? "",
      created_at: lec.created_at ?? "",
    })) ?? [];

  return (
    <div className="mx-auto mt-16 flex w-full flex-col items-center lg:w-3xl">
      <CourseHeader
        courseId={courseId}
        courseTitle={courseTitle!}
        isDefault={!!isDefault}
      />

      <div className="mb-12 w-full">
        <DropzoneComponent
          isCoursePage={true}
          courseId={courseId}
          uploadLectures={uploadLectures}
        />
      </div>
      <DataTable columns={columns} data={tableLectures} />
    </div>
  );
}
