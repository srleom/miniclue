// next
import { Metadata } from "next";

// components
import { LectureResponseDTO } from "@/app/(dashboard)/(app)/course/[courseId]/_components/columns";
import { CourseTable } from "@/app/(dashboard)/(app)/course/[courseId]/_components/course-table";
import { DropzoneComponent } from "@/app/(dashboard)/(app)/_components/dropzone";
import CourseHeader from "./_components/course-header";

// code
import {
  getCourseDetails,
  getCourseLectures,
} from "@/app/(dashboard)/_actions/course-actions";
import { getUserCourses } from "@/app/(dashboard)/_actions/user-actions";

// lib
import { logger } from "@/lib/logger";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
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
  const { title: courseTitle, is_default: isDefault } =
    courseRes.data ?? ({} as { title?: string; is_default?: boolean });
  const lecturesDTO = await getCourseLectures(courseId, 10000, 0);

  // Get available courses for move functionality
  const { data: availableCourses, error: coursesError } =
    await getUserCourses();
  if (coursesError) {
    logger.error("Failed to load available courses:", coursesError);
  }

  const tableLectures: LectureResponseDTO[] =
    lecturesDTO.data?.map((lec) => ({
      lecture_id: lec.lecture_id ?? "",
      title: lec.title ?? "",
      created_at: lec.created_at ?? "",
    })) ?? [];

  // Transform available courses for the move functionality
  const moveAvailableCourses = coursesError
    ? [] // Fallback to empty array if courses fetch fails
    : (availableCourses?.map((course) => ({
        courseId: course.courseId,
        title: course.title,
      })) ?? []);

  return (
    <div className="mx-auto mt-16 flex w-full flex-col items-center lg:w-3xl">
      <CourseHeader
        courseId={courseId}
        courseTitle={courseTitle!}
        isDefault={!!isDefault}
      />

      <div className="mb-12 w-full">
        <DropzoneComponent isCoursePage={true} courseId={courseId} />
      </div>
      <CourseTable
        data={tableLectures}
        currentCourseId={courseId}
        availableCourses={moveAvailableCourses}
      />
    </div>
  );
}
