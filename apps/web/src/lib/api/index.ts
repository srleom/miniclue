// third-party
import createClient from "openapi-fetch";

// types
import type { paths } from "@/types/api";

export default function createApi(access_token: string) {
  return createClient<paths>({
    baseUrl: process.env.API_BASE_URL,
    headers: {
      origin: process.env.NEXT_PUBLIC_FE_BASE_URL,
      Authorization: `Bearer ${access_token}`,
    },
  });
}
