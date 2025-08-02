// next
import { Metadata } from "next";

// components
import {
  columns,
  LectureResponseDTO,
} from "@/app/(dashboard)/(app)/course/[courseId]/_components/columns";
import { DataTable } from "@/app/(dashboard)/(app)/course/[courseId]/_components/data-table";
import { DropzoneComponent } from "@/app/(dashboard)/(app)/_components/dropzone";
import CourseHeader from "./_components/course-header";

// code
import {
  getCourseDetails,
  getCourseLectures,
} from "@/app/(dashboard)/_actions/course-actions";
import { uploadLectures } from "@/app/(dashboard)/_actions/lecture-actions";
import {
  getUserUsage,
  getUserSubscription,
} from "@/app/(dashboard)/_actions/user-actions";

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
  if (!courseRes.data) {
    return <p>Course not found</p>;
  }
  const { title: courseTitle, is_default: isDefault } = courseRes.data;
  const lecturesDTO = await getCourseLectures(courseId);
  const { data: userUsage, error: usageError } = await getUserUsage();
  const { data: subscription, error: subscriptionError } =
    await getUserSubscription();

  if (usageError) {
    logger.error("Failed to load user usage:", usageError);
  }

  if (subscriptionError) {
    logger.error("Failed to load subscription:", subscriptionError);
  }

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
          userUsage={userUsage}
          subscription={subscription}
        />
      </div>
      <DataTable columns={columns} data={tableLectures} />
    </div>
  );
}
