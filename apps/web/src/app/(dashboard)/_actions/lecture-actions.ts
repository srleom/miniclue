"use server";

// next
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

// lib
import {
  ActionResponse,
  createAuthenticatedApi,
} from "@/lib/api/authenticated-api";
import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/error-utils";

// HeyAPI generated SDK
import {
  updateLecture as updateLectureSDK,
  batchUploadUrl as batchUploadUrlSDK,
  uploadComplete as uploadCompleteSDK,
  getLecture as getLectureSDK,
  deleteLecture as deleteLectureSDK,
  getSignedUrl as getSignedUrlSDK,
  type UpdateLectureResponse,
  type BatchUploadUrlResponse,
  type UploadCompleteResponse,
  type GetLectureResponse,
  type GetSignedUrlResponse,
} from "@/lib/api/generated";

export async function handleUpdateLectureAccessedAt(
  lectureId: string,
): Promise<ActionResponse<void>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { error: lectureError } = await updateLectureSDK({
    client: api,
    path: { lectureId },
    body: {
      accessed_at: new Date().toISOString(),
    },
  });

  if (lectureError) {
    logger.error("Update lecture error:", lectureError);
    return { error: String(lectureError) };
  }

  revalidateTag("recents", "max");

  return { error: undefined };
}

export async function getUploadUrls(
  courseId: string,
  filenames: string[],
): Promise<ActionResponse<BatchUploadUrlResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: uploadError } = await batchUploadUrlSDK({
    client: api,
    body: {
      course_id: courseId,
      filenames,
    },
  });

  if (uploadError) {
    logger.error("Get upload URLs error:", uploadError);
    return { error: String(uploadError) };
  }

  return { data, error: undefined };
}

export async function completeUpload(
  lectureId: string,
): Promise<ActionResponse<UploadCompleteResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: completeError } = await uploadCompleteSDK({
    client: api,
    path: { lectureId },
    body: {},
  });

  if (completeError) {
    logger.error("Complete upload error:", completeError);
    return { error: String(completeError) };
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
): Promise<ActionResponse<BatchUploadUrlResponse>> {
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
): Promise<ActionResponse<UploadCompleteResponse>> {
  return await completeUpload(lectureId);
}

export async function getLecture(
  lectureId: string,
): Promise<ActionResponse<GetLectureResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await getLectureSDK({
    client: api,
    path: { lectureId },
  });

  if (fetchError) {
    logger.error("Get lecture error:", fetchError);
    return { data: undefined, error: getErrorMessage(fetchError) };
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

  const { data: lecture, error: fetchError } = await getLectureSDK({
    client: api,
    path: { lectureId },
  });

  if (fetchError || !lecture?.course_id) {
    logger.error("Fetch lecture for delete error:", fetchError);
    return { error: "Failed to fetch lecture to determine course." };
  }

  const { error: deleteError } = await deleteLectureSDK({
    client: api,
    path: { lectureId },
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
): Promise<ActionResponse<GetSignedUrlResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await getSignedUrlSDK({
    client: api,
    path: { lectureId },
  });

  if (fetchError) {
    logger.error("Get signed PDF URL error:", fetchError);
    return { error: getErrorMessage(fetchError) };
  }

  return { data: data ?? undefined, error: undefined };
}

export async function updateLecture(
  lectureId: string,
  title: string,
): Promise<ActionResponse<UpdateLectureResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: updateError } = await updateLectureSDK({
    client: api,
    path: { lectureId },
    body: { title },
  });

  if (updateError) {
    logger.error("Update lecture error:", updateError);
    return { error: String(updateError) };
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
): Promise<ActionResponse<UpdateLectureResponse>> {
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
  const { data: currentLecture, error: fetchError } = await getLectureSDK({
    client: api,
    path: { lectureId },
  });

  if (fetchError || !currentLecture) {
    logger.error("Failed to fetch current lecture:", fetchError);
    return { error: "Failed to fetch lecture details" };
  }

  const oldCourseId = currentLecture.course_id;

  // Update the lecture with the new course_id
  const { data, error: updateError } = await updateLectureSDK({
    client: api,
    path: { lectureId },
    body: { course_id: newCourseId },
  });

  if (updateError) {
    logger.error("Move lecture error:", updateError);
    return { error: String(updateError) };
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
