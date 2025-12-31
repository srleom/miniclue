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
 * @returns {Promise<ActionResponse<components["schemas"]["dto.UserResponseDTO"]>>}
 */
export async function getUser(): Promise<
  ActionResponse<components["schemas"]["dto.UserResponseDTO"]>
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
    (r: components["schemas"]["dto.UserRecentLectureResponseDTO"]) => ({
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
    (c: components["schemas"]["dto.UserCourseResponseDTO"]) => ({
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
    // 1. Get the current user's profile to get their ID before we delete it
    const { data: user, error: profileError } = await getUser();

    if (profileError || !user) {
      return { error: "Failed to get user profile" };
    }

    // Type guard to ensure we have the full user profile with user_id
    if (!("user_id" in user) || !user.user_id) {
      return { error: "User ID not found in profile" };
    }

    // 2. Initialize authenticated API to call the Go backend
    const { api, error: apiError } = await createAuthenticatedApi();
    if (apiError || !api) {
      return { error: apiError || "Failed to initialize API client" };
    }

    // 3. Call Go backend to clean up resources (S3 files, Secret Manager secrets)
    // and delete the user profile record. This must happen while the user's
    // session is still valid.
    const { error: backendError } = await api.DELETE("/users/me");
    if (backendError) {
      logger.error("Delete user backend cleanup error:", backendError);
      // We continue even if backend cleanup fails to ensure the account is still deleted from Auth
    }

    // 4. Create Supabase client with service role key for admin operations
    const supabase = await createAdminClient();

    // 5. Delete the user from Supabase Auth permanently
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.user_id,
      false, // shouldSoftDelete: false
    );

    if (deleteError) {
      logger.error("Delete user error:", deleteError);
      return { error: deleteError.message };
    }

    // Revalidate any cached user data
    revalidateTag("user-profile", "max");

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

/**
 * List available models and enabled state for the current user.
 */
export async function getUserModels(): Promise<
  ActionResponse<components["schemas"]["dto.ModelsResponseDTO"]>
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET("/users/me/models", {
    next: { tags: ["user-models"] },
  });

  if (fetchError) {
    logger.error("Get user models error:", fetchError);
    const message =
      typeof fetchError === "string" ? fetchError : JSON.stringify(fetchError);
    return { error: message };
  }

  return {
    data: data ?? { providers: [] },
    error: undefined,
  };
}

/**
 * Toggle a model on or off for the current user.
 */
export async function setModelPreference(
  provider: components["schemas"]["dto.ModelPreferenceRequestDTO"]["provider"],
  model: string,
  enabled: boolean,
): Promise<ActionResponse<void>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { error: fetchError } = await api.PUT("/users/me/models", {
    body: {
      provider,
      model,
      enabled,
    },
  });

  if (fetchError) {
    logger.error("Set model preference error:", fetchError);
    const message =
      typeof fetchError === "string" ? fetchError : JSON.stringify(fetchError);
    return { error: message };
  }

  return { error: undefined };
}
