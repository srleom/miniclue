// third-party
import { createClient } from "@hey-api/client-fetch";

/**
 * Creates an authenticated API client for the API endpoints
 * @param access_token - The Supabase access token for authentication
 * @returns Configured client for use with HeyAPI generated SDK functions
 */
export default function createApi(access_token: string) {
  const baseURL = process.env.API_BASE_URL ?? "";

  return createClient({
    baseUrl: baseURL,
    headers: {
      origin: process.env.NEXT_PUBLIC_FE_BASE_URL ?? "",
      Authorization: `Bearer ${access_token}`,
    },
  });
}
