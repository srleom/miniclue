"use server";

// next
import { cookies } from "next/headers";

// lib
import {
  ActionResponse,
  createAuthenticatedApi,
} from "@/lib/api/authenticated-api";
import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/error-utils";

// HeyAPI generated SDK
import {
  createChat as createChatSDK,
  getChats as getChatsSDK,
  getChat as getChatSDK,
  deleteChat as deleteChatSDK,
  updateChat as updateChatSDK,
  listMessages as listMessagesSDK,
  type CreateChatResponse,
  type GetChatsResponse,
  type GetChatResponse,
  type UpdateChatResponse,
  type ListMessagesResponse,
} from "@/lib/api/generated";

export async function createChat(
  lectureId: string,
  title?: string,
): Promise<ActionResponse<CreateChatResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: createError } = await createChatSDK({
    client: api,
    path: { lectureId },
    body: title ? { title } : {},
  });

  if (createError) {
    logger.error("Create chat error:", createError);
    return { error: String(createError) };
  }

  return { data, error: undefined };
}

export async function getChats(
  lectureId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<ActionResponse<GetChatsResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await getChatsSDK({
    client: api,
    path: { lectureId },
    query: { limit, offset },
  });

  if (fetchError) {
    logger.error("Get chats error:", fetchError);
    return { data: undefined, error: getErrorMessage(fetchError) };
  }

  return { data: data ?? undefined, error: undefined };
}

export async function getChat(
  lectureId: string,
  chatId: string,
): Promise<ActionResponse<GetChatResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await getChatSDK({
    client: api,
    path: { lectureId, chatId },
  });

  if (fetchError) {
    logger.error("Get chat error:", fetchError);
    return { data: undefined, error: getErrorMessage(fetchError) };
  }

  return { data: data ?? undefined, error: undefined };
}

export async function getMessages(
  lectureId: string,
  chatId: string,
  limit: number = 100,
): Promise<ActionResponse<ListMessagesResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: fetchError } = await listMessagesSDK({
    client: api,
    path: { lectureId, chatId },
    query: { limit },
  });

  if (fetchError) {
    logger.error("Get messages error:", fetchError);
    return { error: getErrorMessage(fetchError) };
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

  const { error: deleteError } = await deleteChatSDK({
    client: api,
    path: { lectureId, chatId },
  });

  if (deleteError) {
    logger.error("Delete chat error:", deleteError);
    return { error: String(deleteError) };
  }

  return { error: undefined };
}

export async function updateChatTitle(
  lectureId: string,
  chatId: string,
  title: string,
): Promise<ActionResponse<UpdateChatResponse>> {
  const { api, error } = await createAuthenticatedApi();
  if (error || !api) {
    return { error };
  }

  const { data, error: updateError } = await updateChatSDK({
    client: api,
    path: { lectureId, chatId },
    body: { title },
  });

  if (updateError) {
    logger.error("Update chat title error:", updateError);
    return { error: String(updateError) };
  }

  return { data, error: undefined };
}

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}
