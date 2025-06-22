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
import { getUserData, getUserRecents, getUserCourses } from "@/app/actions";

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

  let user = { name: "", email: "", avatar: "" };
  let navRecents: { name: string; lectureId: string; url: string }[] = [];
  let navCourses: {
    title: string;
    url: string;
    courseId: string;
    isDefault: boolean;
    isActive: boolean;
    items: any[];
  }[] = [];

  const userRes = await getUserData();
  if (userRes.data) {
    user = userRes.data;
  }

  const recentsRes = await getUserRecents();
  if (recentsRes.data) {
    navRecents = recentsRes.data;
  }

  const coursesRes = await getUserCourses();
  if (coursesRes.data) {
    navCourses = coursesRes.data;
  }

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
                  <BreadcrumbLink href="/">Drafts</BreadcrumbLink>
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
