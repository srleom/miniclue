// components
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NavUser } from "@/app/(dashboard)/(app)/_components/layout/nav-user";
import LectureHeader from "./_components/lecture-header";

// next
import Link from "next/link";

// ui
import { Button } from "@/components/ui/button";

// icons
import { BookX } from "lucide-react";

// code
import { getCourseDetails } from "@/app/(dashboard)/_actions/course-actions";
import { getLecture } from "@/app/(dashboard)/_actions/lecture-actions";
import { getUser } from "@/app/(dashboard)/_actions/user-actions";
import { handleLogout } from "@/app/auth/actions";

export default async function LectureLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lectureId: string }>;
}) {
  let user = { name: "", email: "", avatar: "" };
  const userRes = await getUser();
  if (userRes.data) {
    user = {
      name: userRes.data.name ?? "",
      email: userRes.data.email ?? "",
      avatar: userRes.data.avatar_url ?? "",
    };
  }

  const { lectureId } = await params;
  const lectureRes = await getLecture(lectureId);
  if (!lectureRes.data) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border">
            <BookX className="text-muted-foreground size-6" />
          </div>
          <h1 className="text-foreground text-2xl font-semibold">
            Lecture not found
          </h1>
          <p className="text-muted-foreground mt-2">
            The lecture you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild>
              <Link href="/">Go to dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  const { title: lectureTitle, course_id: courseId } = lectureRes.data;

  const courseRes = await getCourseDetails(courseId!);
  if (!courseRes.data) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border">
            <BookX className="text-muted-foreground size-6" />
          </div>
          <h1 className="text-foreground text-2xl font-semibold">
            Course not found
          </h1>
          <p className="text-muted-foreground mt-2">
            The course you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild>
              <Link href="/">Go to dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  const { title: courseTitle } = courseRes.data;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between">
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
                <LectureHeader
                  lectureId={lectureId}
                  lectureTitle={lectureTitle!}
                />
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2 px-4">
          <NavUser user={user} handleLogout={handleLogout} />
        </div>
      </header>
      <div className="mx-auto flex w-full flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
        {children}
      </div>
    </>
  );
}
