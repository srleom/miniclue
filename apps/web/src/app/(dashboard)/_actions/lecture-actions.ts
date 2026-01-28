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
import { logger } from "@/lib/logger";

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
    logger.error("Update lecture error:", lectureError);
    return { error: lectureError };
  }

  revalidateTag("recents", "max");

  return { error: undefined };
}

export async function getUploadUrls(
  courseId: string,
  filenames: string[],
): Promise<
  ActionResponse<components["schemas"]["dto.LectureBatchUploadURLResponseDTO"]>
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: uploadError } = await api.POST(
    "/lectures/batch-upload-url",
    {
      body: {
        course_id: courseId,
        filenames,
      },
    },
  );

  if (uploadError) {
    logger.error("Get upload URLs error:", uploadError);
    return { error: uploadError };
  }

  return { data, error: undefined };
}

export async function completeUpload(
  lectureId: string,
): Promise<
  ActionResponse<components["schemas"]["dto.LectureUploadCompleteResponseDTO"]>
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: completeError } = await api.POST(
    "/lectures/{lectureId}/upload-complete",
    {
      params: { path: { lectureId } },
      body: {},
    },
  );

  if (completeError) {
    logger.error("Complete upload error:", completeError);
    return { error: completeError };
  }

  if (data?.course_id) {
    revalidateTag(`lectures:${data.course_id}`, "max");
  }
  revalidateTag("recents", "max");

  return { data, error: undefined };
}

export async function uploadLecturesFromClient(
  courseId: string,
  filenames: string[],
): Promise<
  ActionResponse<components["schemas"]["dto.LectureBatchUploadURLResponseDTO"]>
> {
  try {
    // Step 1: Get presigned URLs for all files
    const { data: uploadUrlsData, error: urlsError } = await getUploadUrls(
      courseId,
      filenames,
    );

    if (urlsError || !uploadUrlsData?.uploads) {
      return { error: urlsError || "Failed to get upload URLs" };
    }

    return { data: uploadUrlsData, error: undefined };
  } catch (error) {
    logger.error("Upload lectures from client error:", error);
    return { error: "Failed to get upload URLs" };
  }
}

export async function completeUploadFromClient(
  lectureId: string,
): Promise<
  ActionResponse<components["schemas"]["dto.LectureUploadCompleteResponseDTO"]>
> {
  return await completeUpload(lectureId);
}

export async function getLecture(
  lectureId: string,
): Promise<ActionResponse<components["schemas"]["dto.LectureResponseDTO"]>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET("/lectures/{lectureId}", {
    params: { path: { lectureId } },
    next: { tags: [`lecture:${lectureId}`] },
  });

  if (fetchError) {
    logger.error("Get lecture error:", fetchError);
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
    logger.error("Fetch lecture for delete error:", fetchError);
    return { error: "Failed to fetch lecture to determine course." };
  }

  const { error: deleteError } = await api.DELETE("/lectures/{lectureId}", {
    params: { path: { lectureId } },
  });

  if (deleteError) {
    logger.error("Delete lecture error:", deleteError);
    return { error: "Failed to delete lecture." };
  }

  revalidateTag(`lectures:${lecture.course_id}`, "max");
  revalidateTag("recents", "max");
  redirect(`/course/${lecture.course_id}`);
}

export async function getSignedPdfUrl(
  lectureId: string,
): Promise<ActionResponse<components["schemas"]["dto.SignedURLResponseDTO"]>> {
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
    logger.error("Get signed PDF URL error:", fetchError);
    return { data: undefined, error: fetchError };
  }
  return { data: data ?? undefined, error: undefined };
}

export async function updateLecture(
  lectureId: string,
  title: string,
): Promise<ActionResponse<components["schemas"]["dto.LectureResponseDTO"]>> {
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
    logger.error("Update lecture error:", updateError);
    return { error: updateError };
  }

  // Revalidate lecture list and detail
  if (data?.course_id) {
    revalidateTag(`lectures:${data.course_id}`, "max");
  }
  revalidateTag(`lecture:${lectureId}`, "max");
  revalidateTag("recents", "max");
  return { data, error: undefined };
}

export async function moveLecture(
  lectureId: string,
  newCourseId: string,
): Promise<ActionResponse<components["schemas"]["dto.LectureResponseDTO"]>> {
  // Validate inputs
  if (!lectureId || lectureId.trim() === "") {
    logger.error("Invalid lecture ID:", lectureId);
    return { error: "Invalid lecture ID" };
  }

  if (!newCourseId || newCourseId.trim() === "") {
    logger.error("Invalid course ID:", newCourseId);
    return { error: "Invalid course ID" };
  }

  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    logger.error("Failed to create authenticated API:", error);
    return { error };
  }

  // Get current lecture for revalidation
  const { data: currentLecture, error: fetchError } = await api.GET(
    "/lectures/{lectureId}",
    {
      params: { path: { lectureId } },
    },
  );

  if (fetchError || !currentLecture) {
    logger.error("Failed to fetch current lecture:", fetchError);
    return { error: "Failed to fetch lecture details" };
  }

  const oldCourseId = currentLecture.course_id;

  // Update the lecture with the new course_id
  const { data, error: updateError } = await api.PATCH(
    "/lectures/{lectureId}",
    {
      params: { path: { lectureId } },
      body: { course_id: newCourseId },
    },
  );

  if (updateError) {
    logger.error("Move lecture error:", updateError);
    return { error: updateError };
  }

  // Revalidate lecture lists for both old and new courses
  if (oldCourseId) {
    revalidateTag(`lectures:${oldCourseId}`, "max");
  }
  revalidateTag(`lectures:${newCourseId}`, "max");
  revalidateTag("recents", "max");

  // Revalidate the specific lecture detail page
  revalidateTag(`lecture:${lectureId}`, "max");

  return { data, error: undefined };
}
