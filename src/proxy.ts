// next
import { type NextRequest, NextResponse } from "next/server";

// code
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/relay-xYmY/")) {
    const destinationHost = pathname.startsWith("/relay-xYmY/static/")
      ? "us-assets.i.posthog.com"
      : "us.i.posthog.com";

    const newUrl = new URL(
      pathname.replace("/relay-xYmY", ""),
      `https://${destinationHost}`,
    );

    const headers = new Headers(request.headers);
    headers.delete("cookie");
    headers.set("host", destinationHost);

    return NextResponse.rewrite(newUrl, {
      headers,
    });
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/relay-xYmY/:path*",
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any image extension (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
