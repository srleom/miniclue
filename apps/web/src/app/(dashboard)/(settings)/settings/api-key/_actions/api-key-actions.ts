"use server";

// next
import { revalidateTag, revalidatePath } from "next/cache";

// lib
import {
  ActionResponse,
  createAuthenticatedApi,
} from "@/lib/api/authenticated-api";
import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/error-utils";
import type { Provider } from "@/types/chat";

// HeyAPI generated SDK
import {
  storeApiKey as storeApiKeySDK,
  deleteApiKey as deleteApiKeySDK,
  type StoreApiKeyResponse,
  type DeleteApiKeyResponse,
} from "@/lib/api/generated";

/**
 * Stores the user's API key securely.
 * @param {Provider} provider - The API provider
 * @param {string} apiKey - The API key to store
 * @returns {Promise<ActionResponse<StoreApiKeyResponse>>}
 */
export async function storeAPIKey(
  provider: Provider,
  apiKey: string,
): Promise<ActionResponse<StoreApiKeyResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await storeApiKeySDK({
    client: api,
    body: {
      provider: provider,
      api_key: apiKey,
    },
  });

  if (fetchError) {
    logger.error("Store API key error:", fetchError);
    return { error: getErrorMessage(fetchError) };
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
 * @returns {Promise<ActionResponse<DeleteApiKeyResponse>>}
 */
export async function deleteAPIKey(
  provider: Provider,
): Promise<ActionResponse<DeleteApiKeyResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await deleteApiKeySDK({
    client: api,
    query: { provider: provider },
  });

  if (fetchError) {
    logger.error("Delete API key error:", fetchError);
    return { error: getErrorMessage(fetchError) };
  }

  // Revalidate user profile cache to reflect the updated API key status
  revalidateTag("user-profile", "max");
  // Also revalidate the API key settings page to ensure it shows updated status
  revalidatePath("/settings/api-key");

  return { data, error: undefined };
}
