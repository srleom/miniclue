"use server";

// next
import { cookies } from "next/headers";

// types
import { components } from "@/types/api";

// lib
import {
  ActionResponse,
  createAuthenticatedApi,
} from "@/lib/api/authenticated-api";
import { logger } from "@/lib/logger";

export async function createChat(
  lectureId: string,
  title?: string,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.ChatResponseDTO"]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: createError } = await api.POST(
    "/lectures/{lectureId}/chats",
    {
      params: { path: { lectureId } },
      body: title ? { title } : {},
    },
  );

  if (createError) {
    logger.error("Create chat error:", createError);
    return { error: createError };
  }

  return { data, error: undefined };
}

export async function getChats(
  lectureId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.ChatResponseDTO"][]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET(
    "/lectures/{lectureId}/chats",
    {
      params: { path: { lectureId } },
      query: { limit, offset },
    },
  );

  if (fetchError) {
    logger.error("Get chats error:", fetchError);
    return { data: undefined, error: fetchError };
  }

  return { data: data ?? undefined, error: undefined };
}

export async function getChat(
  lectureId: string,
  chatId: string,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.ChatResponseDTO"]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET(
    "/lectures/{lectureId}/chats/{chatId}",
    {
      params: { path: { lectureId, chatId } },
    },
  );

  if (fetchError) {
    logger.error("Get chat error:", fetchError);
    return { data: undefined, error: fetchError };
  }

  return { data: data ?? undefined, error: undefined };
}

export async function getMessages(
  lectureId: string,
  chatId: string,
  limit: number = 100,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.MessageResponseDTO"][]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await api.GET(
    "/lectures/{lectureId}/chats/{chatId}/messages",
    {
      params: { path: { lectureId, chatId } },
      query: { limit },
    },
  );

  if (fetchError) {
    logger.error("Get messages error:", fetchError);
    return { data: undefined, error: fetchError };
  }

  return { data: data ?? undefined, error: undefined };
}

export async function deleteChat(
  lectureId: string,
  chatId: string,
): Promise<ActionResponse<void>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { error: deleteError } = await api.DELETE(
    "/lectures/{lectureId}/chats/{chatId}",
    {
      params: { path: { lectureId, chatId } },
    },
  );

  if (deleteError) {
    logger.error("Delete chat error:", deleteError);
    return { error: deleteError };
  }

  return { error: undefined };
}

export async function updateChatTitle(
  lectureId: string,
  chatId: string,
  title: string,
): Promise<
  ActionResponse<
    components["schemas"]["app_internal_api_v1_dto.ChatResponseDTO"]
  >
> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: updateError } = await api.PATCH(
    "/lectures/{lectureId}/chats/{chatId}",
    {
      params: { path: { lectureId, chatId } },
      body: { title },
    },
  );

  if (updateError) {
    logger.error("Update chat title error:", updateError);
    return { error: updateError };
  }

  return { data, error: undefined };
}

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}
