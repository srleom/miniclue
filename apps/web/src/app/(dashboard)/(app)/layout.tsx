// next
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// types
import { CourseWithLectures, NavRecentsItem } from "./_types/types";

// components
import { AppSidebar } from "@/app/(dashboard)/(app)/_components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PostHogIdentifier } from "@/components/elements/posthog-identifier";

// code
import {
  createUntitledCourse,
  deleteCourse,
  getCourseLectures,
  updateCourse,
} from "@/app/(dashboard)/(app)/_actions/course-actions";
import {
  deleteLecture,
  handleUpdateLectureAccessedAt,
} from "@/app/(dashboard)/(app)/_actions/lecture-actions";
import {
  getUser,
  getUserCourses,
  getUserRecents,
} from "@/app/(dashboard)/_actions/user-actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const sidebarOpen =
    sidebarCookie === undefined ? true : sidebarCookie === "true";

  let navRecents: NavRecentsItem[] = [];
  let navCourses: CourseWithLectures[] = [];

  // Get user data for PostHog identification
  const userRes = await getUser();

  // Check if user has Gemini API key provided, if not redirect to onboarding
  const hasGeminiKey = userRes.data?.api_keys_provided?.gemini ?? false;
  if (!hasGeminiKey) {
    redirect("/onboarding");
  }

  const userId = userRes.data?.user_id ?? "";
  const userEmail = userRes.data?.email ?? "";
  const userName = userRes.data?.name ?? "";

  const recentsRes = await getUserRecents(10000, 0);
  if (recentsRes.data) {
    navRecents = recentsRes.data;
  }

  const coursesRes = await getUserCourses();
  if (coursesRes.data) {
    const lecturePromises = coursesRes.data.map(async (course) => {
      const result = await getCourseLectures(course.courseId, 10000, 0);
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

  // Transform available courses for the move functionality
  const availableCourses =
    coursesRes.data?.map((course) => ({
      courseId: course.courseId,
      title: course.title,
    })) ?? [];

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden">
      {/* Identify user in PostHog */}
      {userId && userEmail && (
        <PostHogIdentifier userId={userId} email={userEmail} name={userName} />
      )}
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar
          navCourses={navCourses}
          navRecents={navRecents}
          createUntitledCourse={createUntitledCourse}
          deleteCourse={deleteCourse}
          renameCourse={updateCourse}
          handleUpdateLectureAccessedAt={handleUpdateLectureAccessedAt}
          deleteLecture={deleteLecture}
          availableCourses={availableCourses}
        />
        <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
