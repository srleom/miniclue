import { createClient } from "@/lib/supabase/server";
import createApi from "@/lib/api";
import type { components } from "@/types/api";

/**
 * Fetches course details using Supabase auth + OpenAPI client
 */
export async function getCourseDetails(
  courseId: string,
): Promise<components["schemas"]["app_internal_api_v1_dto.CourseResponseDTO"]> {
  // init Supabase and get session
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // init OpenAPI client
  const api = createApi(session!.access_token);

  // fetch course
  const res = await api.GET("/courses/{courseId}", {
    params: { path: { courseId } },
    next: { tags: ["course", courseId] },
  });
  if (!res.data) {
    throw new Error("Course not found");
  }
  return res.data;
}

/**
 * Fetches lectures for a given course
 */
export async function getCourseLectures(
  courseId: string,
): Promise<
  components["schemas"]["app_internal_api_v1_dto.LectureResponseDTO"][]
> {
  // init Supabase and get session
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // init OpenAPI client
  const api = createApi(session!.access_token);

  // fetch lectures list by courseId
  const res = await api.GET("/lectures", {
    params: { query: { course_id: courseId } },
    next: { tags: ["courseLectures", courseId] },
  });
  console.log(res.data);
  return res.data ?? [];
}
