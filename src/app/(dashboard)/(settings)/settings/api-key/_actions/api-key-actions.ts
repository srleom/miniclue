"use server";

// next
import { revalidateTag, revalidatePath } from "next/cache";

// types
import type { components } from "@/types/api";

// lib
import {
  ActionResponse,
  createAuthenticatedApi,
} from "@/lib/api/authenticated-api";
import { logger } from "@/lib/logger";
import type { Provider } from "@/types/chat";

/**
 * Stores the user's API key securely.
 * @param {Provider} provider - The API provider
 * @param {string} apiKey - The API key to store
 * @returns {Promise<ActionResponse<components["schemas"]["dto.APIKeyResponseDTO"]>>}
 */
export async function storeAPIKey(
  provider: Provider,
  apiKey: string,
): Promise<ActionResponse<components["schemas"]["dto.APIKeyResponseDTO"]>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.POST("/users/me/api-key", {
    body: {
      provider: provider,
      api_key: apiKey,
    },
  });

  if (fetchError) {
    logger.error("Store API key error:", fetchError);
    return { error: fetchError };
  }

  // Revalidate user profile cache to reflect the updated API key status
  revalidateTag("user-profile", "max");
  // Also revalidate the API key settings page to ensure it shows updated status
  revalidatePath("/settings/api-key");

  return { data, error: undefined };
}

/**
 * Deletes the user's API key securely.
 * @param {Provider} provider - The API provider
 * @returns {Promise<ActionResponse<components["schemas"]["dto.APIKeyResponseDTO"]>>}
 */
export async function deleteAPIKey(
  provider: Provider,
): Promise<ActionResponse<components["schemas"]["dto.APIKeyResponseDTO"]>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.DELETE("/users/me/api-key", {
    params: {
      query: { provider: provider },
    },
  });

  if (fetchError) {
    logger.error("Delete API key error:", fetchError);
    return { error: fetchError };
  }

  // Revalidate user profile cache to reflect the updated API key status
  revalidateTag("user-profile", "max");
  // Also revalidate the API key settings page to ensure it shows updated status
  revalidatePath("/settings/api-key");

  return { data, error: undefined };
}
