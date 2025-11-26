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

export async function createUntitledCourse(): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.CourseResponseDTO"]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { error: courseError } = await api.POST("/courses", {
    body: {
      title: "Untitled Course",
      description: "",
    },
  });

  if (courseError) {
    logger.error("Create course error:", courseError);
    return { error: courseError };
  }

  revalidateTag("courses", "max");
  return { error: undefined };
}

export async function deleteCourse(
  courseId: string,
): Promise<ActionResponse<void>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { error: deleteError } = await api.DELETE("/courses/{courseId}", {
    params: { path: { courseId } },
  });

  if (deleteError) {
    logger.error("Delete course error:", deleteError);
    return { error: deleteError };
  }

  revalidateTag("courses", "max");
  revalidateTag("recents", "max");
  redirect("/");
  return { error: undefined };
}

export async function getCourseLectures(
  courseId: string,
  limit: number = 5,
  offset: number = 0,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.LectureResponseDTO"][]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET("/lectures", {
    params: {
      query: { course_id: courseId, limit, offset },
    },
    next: { tags: [`lectures:${courseId}`], revalidate: 300 },
  });

  if (fetchError) {
    logger.error("Get lectures error:", fetchError);
    return { data: [], error: fetchError };
  }

  return { data, error: undefined };
}

export async function getCourseDetails(
  courseId: string,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.CourseResponseDTO"]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET("/courses/{courseId}", {
    params: { path: { courseId } },
    next: { tags: [`course:${courseId}`] },
  });

  if (fetchError) {
    logger.error("Get lecture error:", fetchError);
    return { data: undefined, error: fetchError };
  }

  return { data: data ?? undefined, error: undefined };
}

export async function updateCourse(
  courseId: string,
  title: string,
  description?: string,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.CourseResponseDTO"]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: updateError } = await api.PATCH("/courses/{courseId}", {
    params: { path: { courseId } },
    body: { title, description },
  });

  if (updateError) {
    logger.error("Update course error:", updateError);
    return { error: updateError };
  }

  revalidateTag("courses", "max");
  revalidateTag(`course:${courseId}`, "max");
  return { data, error: undefined };
}
