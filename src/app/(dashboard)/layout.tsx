import { AppSidebar } from "@/app/(dashboard)/_components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import {
  getUserRecents,
  getUserCourses,
} from "@/app/(dashboard)/_actions/sidebar-actions";
import {
  createUntitledCourse,
  deleteCourse,
  getCourseLectures,
  updateCourse,
} from "@/app/(dashboard)/_actions/course-actions";
import {
  handleUpdateLectureAccessedAt,
  deleteLecture,
} from "@/app/(dashboard)/_actions/lecture-actions";
import { CourseWithLectures, NavRecentsItem } from "./_types/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const sidebarOpen = sidebarCookie === "true";

  let navRecents: NavRecentsItem[] = [];
  let navCourses: CourseWithLectures[] = [];

  const recentsRes = await getUserRecents();
  if (recentsRes.data) {
    navRecents = recentsRes.data;
  }

  const coursesRes = await getUserCourses();
  if (coursesRes.data) {
    const lecturePromises = coursesRes.data.map(async (course) => {
      const result = await getCourseLectures(course.courseId);
      const lectures =
        result.data?.filter(
          (lecture): lecture is { lecture_id: string; title: string } =>
            lecture.lecture_id !== undefined && lecture.title !== undefined,
        ) || [];
      return {
        ...course,
        lectures,
      };
    });

    navCourses = await Promise.all(lecturePromises);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar
          navCourses={navCourses}
          navRecents={navRecents}
          createUntitledCourse={createUntitledCourse}
          deleteCourse={deleteCourse}
          renameCourse={updateCourse}
          handleUpdateLectureAccessedAt={handleUpdateLectureAccessedAt}
          deleteLecture={deleteLecture}
        />
        <SidebarInset className="flex min-h-0 flex-1 flex-col">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
