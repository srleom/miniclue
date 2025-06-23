"use server";

import { components } from "@/types/api";
import {
  createAuthenticatedApi,
  ActionResponse,
} from "@/lib/api/authenticated-api";

export async function getLecture(
  lectureId: string,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.LectureResponseDTO"]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET("/lectures/{lectureId}", {
    params: { path: { lectureId } },
    next: { tags: [`lecture:${lectureId}`] },
  });

  if (fetchError) {
    console.error("Get lecture error:", fetchError);
    return { data: undefined, error: fetchError };
  }

  return { data: data ?? undefined, error: undefined };
}
