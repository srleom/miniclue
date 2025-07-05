// components
import { NavUser } from "@/app/(dashboard)/_components/layout/nav-user";
import { SidebarTrigger } from "@/components/ui/sidebar";

// code
import { getUserData } from "@/app/(dashboard)/_actions/sidebar-actions";
import { handleLogout } from "@/app/auth/actions";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
