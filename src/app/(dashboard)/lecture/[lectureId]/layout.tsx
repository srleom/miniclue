import { getUserData } from "@/app/(dashboard)/sidebar-actions";
import { handleLogout } from "@/app/auth/actions";
import { NavUser } from "@/components/app/layout/nav-user";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getLecture } from "./actions";
import { getCourseDetails } from "../../actions";
import { Separator } from "@/components/ui/separator";

export default async function LectureLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lectureId: string };
}) {
  let user = { name: "", email: "", avatar: "" };
  const userRes = await getUserData();
  if (userRes.data) {
    user = userRes.data;
  }

  const { lectureId } = await params;
  const lectureRes = await getLecture(lectureId);
  if (!lectureRes.data) {
    return <p>Lecture not found</p>;
  }
  const { title: lectureTitle, course_id: courseId } = lectureRes.data;

  const courseRes = await getCourseDetails(courseId!);
  if (!courseRes.data) {
    return <p>Course not found</p>;
  }
  const { title: courseTitle } = courseRes.data;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 hover:cursor-pointer" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/course/${courseId}`}>
                  {courseTitle}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{lectureTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2 px-4">
          <NavUser user={user} handleLogout={handleLogout} />
        </div>
      </header>
      <div className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 pt-0">
        {children}
      </div>
    </>
  );
}
