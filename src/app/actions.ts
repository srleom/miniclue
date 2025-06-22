"use server";

import createApi from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";

import type { components } from "@/types/api";

export type ActionResponse<T> = {
  data?: T;
  error?: string;
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

export async function createUntitledCourse(): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.CourseResponseDTO"]
  >
> {
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
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.LectureResponseDTO"][]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET("/lectures", {
    params: { query: { course_id: courseId } },
    next: { tags: [`lectures:${courseId}`], revalidate: 300 },
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

  return { error: undefined };
}

/**
 * Gets the authenticated user's profile info.
 * @returns {Promise<ActionResponse<{ name: string; email: string; avatar: string }>>}
 */
export async function getUserData(): Promise<
  ActionResponse<{ name: string; email: string; avatar: string }>
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET("/users/me", {
    next: { tags: ["user"] },
  });

  if (fetchError) {
    console.error("Get user error:", fetchError);
    return { error: fetchError };
  }

  const userResponse = data ?? {
    name: "",
    email: "",
    avatar_url: "",
  };

  return {
    data: {
      name: userResponse.name ?? "",
      email: userResponse.email ?? "",
      avatar: userResponse.avatar_url ?? "",
    },
    error: undefined,
  };
}

/**
 * Gets the authenticated user's recent lectures.
 * @returns {Promise<ActionResponse<{ name: string; lectureId: string; url: string }[]>>}
 */
export async function getUserRecents(): Promise<
  ActionResponse<{ name: string; lectureId: string; url: string }[]>
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET("/users/me/recents", {
    query: { limit: 10, offset: 0 },
    next: { tags: ["recents"], revalidate: 300 },
  });

  if (fetchError) {
    console.error("Get recents error:", fetchError);
    return { error: fetchError };
  }

  const recentsData = data ?? [];
  const navRecents = recentsData.map(
    (
      r: components["schemas"]["app_internal_api_v1_dto.UserRecentLectureResponseDTO"],
    ) => ({
      name: r.title ?? "",
      lectureId: r.lecture_id!,
      url: `/lecture/${r.lecture_id!}`,
    }),
  );

  return { data: navRecents, error: undefined };
}

/**
 * Gets the authenticated user's courses.
 * @returns {Promise<ActionResponse<{ title: string; url: string; courseId: string; isDefault: boolean; isActive: boolean; items: any[] }[]>>}
 */
export async function getUserCourses(): Promise<
  ActionResponse<
    {
      title: string;
      url: string;
      courseId: string;
      isDefault: boolean;
      isActive: boolean;
      items: any[];
    }[]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET("/users/me/courses", {
    next: { tags: ["courses"] },
  });

  if (fetchError) {
    console.error("Get courses error:", fetchError);
    return { error: fetchError };
  }

  const coursesData = data ?? [];
  const navCourses = coursesData.map(
    (
      c: components["schemas"]["app_internal_api_v1_dto.UserCourseResponseDTO"],
    ) => ({
      title: c.title ?? "",
      url: `/course/${c.course_id!}`,
      courseId: c.course_id!,
      isDefault: c.is_default!,
      isActive: false,
      items: [],
    }),
  );

  return { data: navCourses, error: undefined };
}
