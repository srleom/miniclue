"use server";

// next
import { revalidatePath, revalidateTag } from "next/cache";
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
  createCourse as createCourseSDK,
  deleteCourse as deleteCourseSDK,
  getCourse as getCourseSDK,
  updateCourse as updateCourseSDK,
  getLectures as getLecturesSDK,
  type CreateCourseResponse,
  type GetCourseResponse,
  type UpdateCourseResponse,
  type GetLecturesResponse,
} from "@/lib/api/generated";

export async function createUntitledCourse(): Promise<
  ActionResponse<CreateCourseResponse>
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { error: courseError } = await createCourseSDK({
    client: api,
    body: {
      title: "Untitled Course",
      description: "",
    },
  });

  if (courseError) {
    logger.error("Create course error:", courseError);
    return { error: String(courseError) };
  }

  revalidateTag("courses", "max");
  revalidatePath("/", "layout");
  return { error: undefined };
}

export async function deleteCourse(
  courseId: string,
): Promise<ActionResponse<void>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { error: deleteError } = await deleteCourseSDK({
    client: api,
    path: { courseId },
  });

  if (deleteError) {
    logger.error("Delete course error:", deleteError);
    return { error: String(deleteError) };
  }

  revalidateTag("courses", "max");
  revalidateTag("recents", "max");
  revalidatePath("/", "layout");
  redirect("/");
  return { error: undefined };
}

// TODO: Add pagination support
export async function getCourseLectures(
  courseId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _limit: number = 5,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _offset: number = 0,
): Promise<ActionResponse<GetLecturesResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await getLecturesSDK({
    client: api,
    path: { courseId },
  });

  if (fetchError) {
    logger.error("Get lectures error:", fetchError);
    return { data: [], error: getErrorMessage(fetchError) };
  }

  return { data, error: undefined };
}

export async function getCourseDetails(
  courseId: string,
): Promise<ActionResponse<GetCourseResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await getCourseSDK({
    client: api,
    path: { courseId },
  });

  if (fetchError) {
    logger.error("Get course error:", fetchError);
    return { data: undefined, error: getErrorMessage(fetchError) };
  }

  return { data: data ?? undefined, error: undefined };
}

export async function updateCourse(
  courseId: string,
  title: string,
  description?: string,
): Promise<ActionResponse<UpdateCourseResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: updateError } = await updateCourseSDK({
    client: api,
    path: { courseId },
    body: { title, description },
  });

  if (updateError) {
    logger.error("Update course error:", updateError);
    return { error: String(updateError) };
  }

  revalidateTag("courses", "max");
  revalidateTag(`course:${courseId}`, "max");
  revalidatePath("/", "layout");
  return { data, error: undefined };
}
