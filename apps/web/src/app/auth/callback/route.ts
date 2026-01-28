// next
import { NextResponse } from "next/server";

// code
import { createClient } from "@/lib/supabase/server";
import createApi from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // create user and default Drafts course on first signup
    if (!error && data) {
      const api = createApi(data.session.access_token);
      // create/update user profile
      await api.POST("/users/me", {
        body: {
          name: data.user?.user_metadata?.name,
          email: data.user?.email,
          avatar_url: data.user?.user_metadata?.avatar_url,
        },
      });

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const vercelUrl = process.env.VERCEL_URL;
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else if (vercelUrl) {
        return NextResponse.redirect(`https://${vercelUrl}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
