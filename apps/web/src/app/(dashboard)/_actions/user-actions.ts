"use server";

// next
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

// lib
import {
  ActionResponse,
  createAuthenticatedApi,
} from "@/lib/api/authenticated-api";
import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/error-utils";

// HeyAPI generated SDK
import {
  getUser as getUserSDK,
  deleteUser as deleteUserSDK,
  getRecentLectures as getRecentLecturesSDK,
  getUserCourses as getUserCoursesSDK,
  listModels as listModelsSDK,
  updateModelPreference as updateModelPreferenceSDK,
  type GetUserResponse,
  type ListModelsResponse,
} from "@/lib/api/generated";

/**
 * Gets the authenticated user's profile info.
 * @returns {Promise<ActionResponse<GetUserResponse>>}
 */
export async function getUser(): Promise<ActionResponse<GetUserResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await getUserSDK({
    client: api,
  });

  if (fetchError) {
    logger.error("Get user error:", fetchError);
    return { error: getErrorMessage(fetchError) };
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

  const { data, error: fetchError } = await getRecentLecturesSDK({
    client: api,
    query: {
      limit,
      offset,
    },
  });

  if (fetchError) {
    logger.error("Get recents error:", fetchError);
    return { error: getErrorMessage(fetchError) };
  }

  const recentsData = data?.lectures ?? [];
  const totalCount = data?.total_count ?? 0;

  const navRecents = recentsData.map((r) => ({
    name: r.title ?? "",
    lectureId: r.lecture_id!,
    url: `/lecture/${r.lecture_id!}`,
    courseId: r.course_id!,
    totalCount,
  }));

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

  const { data, error: fetchError } = await getUserCoursesSDK({
    client: api,
  });

  if (fetchError) {
    logger.error("Get courses error:", fetchError);
    return { error: getErrorMessage(fetchError) };
  }

  const coursesData = data ?? [];
  const navCourses = coursesData.map((c) => ({
    title: c.title ?? "",
    url: `/course/${c.course_id!}`,
    courseId: c.course_id!,
    isDefault: c.is_default!,
  }));

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
    const { error: backendError } = await deleteUserSDK({
      client: api,
    });
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
  ActionResponse<ListModelsResponse>
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await listModelsSDK({
    client: api,
  });

  if (fetchError) {
    logger.error("Get user models error:", fetchError);
    return { error: getErrorMessage(fetchError) };
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
  provider: "openai" | "gemini" | "anthropic" | "xai" | "deepseek",
  model: string,
  enabled: boolean,
): Promise<ActionResponse<void>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { error: fetchError } = await updateModelPreferenceSDK({
    client: api,
    body: {
      provider,
      model,
      enabled,
    },
  });

  if (fetchError) {
    logger.error("Set model preference error:", fetchError);
    return { error: getErrorMessage(fetchError) };
  }

  return { error: undefined };
}
