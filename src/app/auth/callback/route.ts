import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
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
      // Check if this is a new user based on created_at timestamp
      const userCreatedAt = new Date(data.user.created_at).getTime();
      const currentTime = Date.now();
      const isNewUser = (currentTime - userCreatedAt) < 5000; // Consider new if created within last 5 seconds

      // create/update user profile
      await api.POST("/users/me", {
        body: {
          name: data.user?.user_metadata?.name,
          email: data.user?.email,
          avatar_url: data.user?.user_metadata?.avatar_url,
        },
      });

      // create default Drafts course only on first signup
      if (isNewUser) {
        await api.POST("/courses", {
          body: {
            title: "Drafts",
            is_default: true,
            description: "Default course",
          },
        });
      }
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
