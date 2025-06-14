"use server";

import createApi from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";

export type ActionResponse<T> = {
  data?: T;
  error?: any;
};

async function createAuthenticatedApi() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return { error: "Auth error" };
  }

  if (!session) {
    return { error: "No session found" };
  }

  return { api: createApi(session.access_token), error: undefined };
}

export async function handleLogin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:3000/auth/callback?next=/",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Login error:", error);
    return;
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function handleLogout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error);
    return;
  }

  redirect("/auth");
}

export async function createUntitledCourse(): Promise<ActionResponse<void>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { error: courseError } = await api.POST("/courses", {
    body: {
      title: "Untitled Course",
      description: "",
    },
  });

  if (courseError) {
    console.error("Create course error:", courseError);
    return { error: courseError };
  }

  revalidateTag("courses");
  return { error: undefined };
}

export async function deleteCourse(
  courseId: string,
): Promise<ActionResponse<void>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { error: deleteError } = await api.DELETE("/courses/{courseId}", {
    params: { path: { courseId } },
  });

  if (deleteError) {
    console.error("Delete course error:", deleteError);
    return { error: deleteError };
  }

  revalidateTag("courses");
  return { error: undefined };
}

export async function getCourseLectures(
  courseId: string,
): Promise<ActionResponse<any[]>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET("/lectures", {
    params: { query: { course_id: courseId } },
    next: { tags: [`lectures:${courseId}`] },
  });

  if (fetchError) {
    console.error("Get lectures error:", fetchError);
    return { data: [], error: fetchError };
  }

  return { data, error: undefined };
}

export async function handleUpdateLectureAccessedAt(
  lectureId: string,
): Promise<ActionResponse<void>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { error: lectureError } = await api.PUT("/lectures/{lectureId}", {
    params: { path: { lectureId } },
    body: {
      accessed_at: new Date().toISOString(),
    },
  });

  if (lectureError) {
    console.error("Update lecture error:", lectureError);
    return { error: lectureError };
  }

  revalidateTag("recents");
  return { error: undefined };
}
