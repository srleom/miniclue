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
    console.error("Create course error:", courseError);
    return { error: courseError };
  }

  revalidateTag("courses");
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
    console.error("Delete course error:", deleteError);
    return { error: deleteError };
  }

  revalidateTag("courses");
  revalidateTag("recents");
  redirect("/");
  return { error: undefined };
}

export async function getCourseLectures(
  courseId: string,
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
    params: { query: { course_id: courseId } },
    next: { tags: [`lectures:${courseId}`], revalidate: 300 },
  });

  if (fetchError) {
    console.error("Get lectures error:", fetchError);
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
    console.error("Get lecture error:", fetchError);
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
    console.error("Update course error:", updateError);
    return { error: updateError };
  }

  revalidateTag("courses");
  revalidateTag(`course:${courseId}`);
  return { data, error: undefined };
}
