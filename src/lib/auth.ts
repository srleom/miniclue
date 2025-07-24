import { createClient } from "@/lib/supabase/server";
import { Provider } from "@supabase/supabase-js";

export async function oauthSignIn(provider: string, flow: "login" | "signup") {
  const supabase = await createClient();
  return supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_FE_BASE_URL}/auth/callback?flow=${flow}&next=/`,
    },
  });
}
