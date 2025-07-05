"use server";

// types
import type { components } from "@/types/api";

// lib
import {
  ActionResponse,
  createAuthenticatedApi,
} from "@/lib/api/authenticated-api";

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
    }),
  );

  return { data: navCourses, error: undefined };
}
