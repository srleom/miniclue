import createClient from "openapi-fetch";
import type { paths } from "@/types/api";

export default function createApi(access_token: string) {
  return createClient<paths>({
    baseUrl: process.env.DEV_API_BASE_URL,
    headers: {
      origin: process.env.DEV_FE_BASE_URL,
      Authorization: `Bearer ${access_token}`,
    },
  });
}
