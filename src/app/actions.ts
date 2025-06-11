"use server";

import createApi from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";

export async function handleLogin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:3000/auth/callback?next=/dashboard",
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

  redirect("/");
}

export async function createUntitledCourse() {
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

  const api = createApi(session.access_token);
  const { data, error: courseError } = await api.POST("/courses", {
    body: {
      title: "Untitled Course",
      description: "",
    },
  });

  if (courseError) {
    console.error("Create course error:", courseError);
    return { error: courseError };
  }

  // Revalidate
  revalidateTag("courses");

  return { error: undefined };
}

export async function deleteCourse(courseId: string) {
  const supabase = await createClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError) {
    return { error: "Auth error" };
  }
  if (!session) {
    return { error: "No session found" };
  }

  const api = createApi(session.access_token);
  const { error: deleteError } = await api.DELETE("/courses/{courseId}", {
    params: { path: { courseId } },
  });

  if (deleteError) {
    console.error("Delete course error:", deleteError);
    return { error: deleteError };
  }

  // Revalidate
  revalidateTag("courses");

  return { error: undefined };
}

export async function getCourseLectures(courseId: string) {
  const supabase = await createClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();
  if (authError) {
    return { error: "Auth error" };
  }
  if (!session) {
    return { error: "No session found" };
  }
  const api = createApi(session.access_token);
  const { data, error } = await api.GET("/courses/{courseId}/lectures", {
    params: { path: { courseId }, query: {} },
    next: { tags: [`lectures:${courseId}`] },
  });
  if (error) {
    console.error("Get lectures error:", error);
    return { data: [], error };
  }
  return { data, error: undefined };
}
