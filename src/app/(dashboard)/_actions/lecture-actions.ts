"use server";

// next
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

// types
import { components } from "@/types/api";

// lib
import {
  ActionResponse,
  createAuthenticatedApi,
} from "@/lib/api/authenticated-api";

export async function handleUpdateLectureAccessedAt(
  lectureId: string,
): Promise<ActionResponse<void>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { error: lectureError } = await api.PATCH("/lectures/{lectureId}", {
    params: { path: { lectureId } },
    body: {
      accessed_at: new Date().toISOString(),
    },
  });

  if (lectureError) {
    console.error("Update lecture error:", lectureError);
    return { error: lectureError };
  }

  return { error: undefined };
}

export async function uploadLectures(
  courseId: string,
  formData: FormData,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.LectureUploadResponseDTO"][]
  >
> {
  formData.append("course_id", courseId);

  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: uploadError } = await api.POST("/lectures", {
    // The type is set to `any` because `openapi-fetch` supports FormData directly,
    // but the auto-generated type from `openapi-typescript` is incorrect for file uploads.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: formData as any,
    bodySerializer: (body) => body,
  });

  if (uploadError) {
    console.error("Upload lectures error:", uploadError);
    return { error: uploadError };
  }

  revalidateTag(`lectures:${courseId}`);
  revalidateTag("recents");

  return { data, error: undefined };
}

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

export async function getExplanations(
  lectureId: string,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.LectureExplanationResponseDTO"][]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET(
    "/lectures/{lectureId}/explanations",
    {
      params: { path: { lectureId } },
      next: { tags: [`explanations:${lectureId}`] },
    },
  );

  if (fetchError) {
    console.error("Get explanations error:", fetchError);
    return { data: undefined, error: fetchError };
  }

  return { data: data ?? undefined, error: undefined };
}

export async function deleteLecture(
  lectureId: string,
): Promise<ActionResponse<void>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data: lecture, error: fetchError } = await api.GET(
    "/lectures/{lectureId}",
    {
      params: { path: { lectureId } },
    },
  );

  if (fetchError || !lecture?.course_id) {
    console.error("Fetch lecture for delete error:", fetchError);
    return { error: "Failed to fetch lecture to determine course." };
  }

  const { error: deleteError } = await api.DELETE("/lectures/{lectureId}", {
    params: { path: { lectureId } },
  });

  if (deleteError) {
    console.error("Delete lecture error:", deleteError);
    return { error: "Failed to delete lecture." };
  }

  revalidateTag(`lectures:${lecture.course_id}`);
  revalidateTag("recents");
  redirect(`/course/${lecture.course_id}`);
}

export async function getSignedPdfUrl(
  lectureId: string,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.SignedURLResponseDTO"]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }
  const { data, error: fetchError } = await api.GET(
    "/lectures/{lectureId}/url",
    {
      params: { path: { lectureId } },
      next: { tags: [`url:${lectureId}`] },
    },
  );
  if (fetchError) {
    console.error("Get signed PDF URL error:", fetchError);
    return { data: undefined, error: fetchError };
  }
  return { data: data ?? undefined, error: undefined };
}

export async function getSummary(
  lectureId: string,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.LectureSummaryResponseDTO"]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET(
    "/lectures/{lectureId}/summary",
    {
      params: { path: { lectureId } },
      next: { tags: [`summary:${lectureId}`] },
    },
  );

  if (fetchError) {
    console.error("Get summary error:", fetchError);
    return { data: undefined, error: fetchError };
  }

  return { data: data ?? undefined, error: undefined };
}

export async function updateLecture(
  lectureId: string,
  title: string,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.LectureResponseDTO"]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: updateError } = await api.PATCH(
    "/lectures/{lectureId}",
    {
      params: { path: { lectureId } },
      body: { title },
    },
  );

  if (updateError) {
    console.error("Update lecture error:", updateError);
    return { error: updateError };
  }

  // Revalidate lecture list and detail
  if (data?.course_id) {
    revalidateTag(`lectures:${data.course_id}`);
  }
  revalidateTag(`lecture:${lectureId}`);
  revalidateTag("recents");
  return { data, error: undefined };
}
