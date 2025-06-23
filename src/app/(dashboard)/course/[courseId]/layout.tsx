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
import { getCourseDetails } from "@/app/(dashboard)/actions";
import { Separator } from "@/components/ui/separator";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { courseId: string };
}) {
  const { courseId } = await params;
  const courseRes = await getCourseDetails(courseId);
  if (!courseRes.data) {
    return <p>Course not found</p>;
  }
  const { title: courseTitle } = courseRes.data;
  let user = { name: "", email: "", avatar: "" };
  const userRes = await getUserData();
  if (userRes.data) {
    user = userRes.data;
  }

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
                <BreadcrumbPage>New</BreadcrumbPage>
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
