"use server";

// next
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

// types
import type { components } from "@/types/api";

// lib
import {
  ActionResponse,
  createAuthenticatedApi,
} from "@/lib/api/authenticated-api";
import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Gets the authenticated user's profile info.
 * @returns {Promise<ActionResponse<components["schemas"]["app_internal_api_v1_dto.UserResponseDTO"]>>}
 */
export async function getUser(): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.UserResponseDTO"]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET("/users/me", {
    next: { tags: ["user-profile"] },
  });

  if (fetchError) {
    logger.error("Get user error:", fetchError);
    return { error: fetchError };
  }

  return { data, error: undefined };
}

/**
 * Gets the authenticated user's recent lectures.
 * @param {number} limit - Number of recents to fetch (default: 5)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<
 *   ActionResponse<
 *     { name: string; lectureId: string; url: string; courseId: string; totalCount: number }[]
 *   >
 * >}
 */
export async function getUserRecents(
  limit: number = 5,
  offset: number = 0,
): Promise<
  ActionResponse<
    {
      name: string;
      lectureId: string;
      url: string;
      courseId: string;
      totalCount: number;
    }[]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET("/users/me/recents", {
    params: {
      query: {
        limit,
        offset,
      },
    },
    next: { tags: ["recents"] },
  });

  if (fetchError) {
    logger.error("Get recents error:", fetchError);
    return { error: fetchError };
  }

  const recentsData = data?.lectures ?? [];
  const totalCount = data?.total_count ?? 0;

  const navRecents = recentsData.map(
    (
      r: components["schemas"]["app_internal_api_v1_dto.UserRecentLectureResponseDTO"],
    ) => ({
      name: r.title ?? "",
      lectureId: r.lecture_id!,
      url: `/lecture/${r.lecture_id!}`,
      courseId: r.course_id!,
      totalCount,
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
    logger.error("Get courses error:", fetchError);
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

/**
 * Deletes the authenticated user's account.
 * @returns {Promise<ActionResponse<void>>}
 */
export async function deleteUserAccount(): Promise<ActionResponse<void>> {
  try {
    // First get the current user's profile to get their ID
    const { data: user, error: profileError } = await getUser();

    if (profileError || !user) {
      return { error: "Failed to get user profile" };
    }

    // Type guard to ensure we have the full user profile with user_id
    if (!("user_id" in user) || !user.user_id) {
      return { error: "User ID not found in profile" };
    }

    // Create Supabase client with service role key for admin operations
    const supabase = await createAdminClient();

    // Delete the user using Supabase admin API
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.user_id,
      false, // shouldSoftDelete: false
    );

    if (deleteError) {
      logger.error("Delete user error:", deleteError);
      return { error: deleteError.message };
    }

    // Revalidate any cached user data
    revalidateTag("user-profile");

    // Redirect to login page after successful deletion
    // This will throw NEXT_REDIRECT which is expected behavior
    redirect("/auth/login");
  } catch (error) {
    // Check if this is a Next.js redirect (expected behavior)
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      // This is expected, let it propagate
      throw error;
    }

    logger.error("Delete user account error:", error);
    return { error: "Failed to delete user account" };
  }
}
