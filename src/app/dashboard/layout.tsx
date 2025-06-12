import { AppSidebar } from "@/components/app/layout/app-sidebar";
import { NavUser } from "@/components/app/layout/nav-user";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import createApi from "@/lib/api";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const sidebarOpen = sidebarCookie === "true";

  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const api = createApi(session!.access_token);

  const userResult = await api.GET("/users/me", {
    next: { tags: ["user"] },
  });
  const userResponse = userResult.data ?? {
    name: "",
    email: "",
    avatar_url: "",
  };
  const user = {
    name: userResponse.name ?? "",
    email: userResponse.email ?? "",
    avatar: userResponse.avatar_url ?? "",
  };

  const recentsResult = await api.GET("/users/me/recents", {
    query: { limit: 10, offset: 0 },
    next: { tags: ["recents"] },
  });
  const recentsData = recentsResult.data ?? [];
  const navRecents = recentsData.map((r) => ({
    name: r.title ?? "",
    url: `/dashboard/lecture/${r.lecture_id}`,
  }));

  const coursesResult = await api.GET("/users/me/courses", {
    next: { tags: ["courses"] },
  });
  const coursesData = coursesResult.data ?? [];
  const navCourses = coursesData.map((c: any) => ({
    title: c.title ?? "",
    url: `/dashboard/course/${c.course_id}`,
    courseId: c.course_id,
    isDefault: c.is_default,
    isActive: false,
    items: [],
  }));

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar navCourses={navCourses} navRecents={navRecents} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 hover:cursor-pointer" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Drafts</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>New</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 px-4">
            <NavUser user={user} />
          </div>
        </header>
        <div className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
