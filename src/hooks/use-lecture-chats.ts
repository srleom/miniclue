import * as React from "react";
import { logger } from "@/lib/logger";
import {
  createChat,
  getChats,
  getMessages,
} from "@/app/(dashboard)/(app)/_actions/chat-actions";
import type { Chat, ChatMessage } from "@/types/chat";

// Helper function to create Chat object from API response
function createChatFromApiResponse(
  apiChat: {
    id?: string;
    lecture_id?: string;
    title?: string;
    created_at?: string;
    updated_at?: string;
  },
  lectureId: string,
): Chat {
  return {
    id: apiChat.id || "",
    lecture_id: apiChat.lecture_id || lectureId,
    title: apiChat.title || "New Chat",
    created_at: apiChat.created_at || new Date().toISOString(),
    updated_at: apiChat.updated_at || new Date().toISOString(),
  };
}

export function useLectureChats(lectureId: string) {
  const [currentChatId, setCurrentChatId] = React.useState<string | null>(null);
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [chatMessages, setChatMessages] = React.useState<
    Record<string, ChatMessage[]>
  >({});
  const [isLoadingChats, setIsLoadingChats] = React.useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const isCreatingChatRef = React.useRef(false);
  const initializedLectureRef = React.useRef<string | null>(null);
  const mountedRef = React.useRef(true);

  // Helper function to create default chat
  const createDefaultChat = React.useCallback(
    async (currentLectureId: string): Promise<Chat | null> => {
      if (isCreatingChatRef.current) {
        return null;
      }
      if (initializedLectureRef.current === currentLectureId) {
        return null;
      }

      isCreatingChatRef.current = true;
      try {
        const { data: newChat, error: createError } =
          await createChat(currentLectureId);

        if (
          !mountedRef.current ||
          initializedLectureRef.current === currentLectureId
        ) {
          return null;
        }

        if (createError) {
          logger.error("Failed to create default chat:", createError);
          return null;
        }

        if (newChat) {
          return createChatFromApiResponse(newChat, currentLectureId);
        }
        return null;
      } finally {
        isCreatingChatRef.current = false;
      }
    },
    [],
  );

  // Load chats and initialize current chat
  React.useEffect(() => {
    mountedRef.current = true;

    if (initializedLectureRef.current === lectureId) {
      return;
    }

    if (
      initializedLectureRef.current !== null &&
      initializedLectureRef.current !== lectureId
    ) {
      setCurrentChatId(null);
      setChats([]);
      setChatMessages({});
    }

    setIsLoadingChats(true);
    getChats(lectureId)
      .then(async ({ data, error }) => {
        if (
          !mountedRef.current ||
          initializedLectureRef.current === lectureId
        ) {
          return;
        }

        if (error) {
          logger.error("Failed fetching chats:", error);
          return;
        }
        if (data) {
          const chatsList = data.map((chat) =>
            createChatFromApiResponse(chat, lectureId),
          );

          if (
            !mountedRef.current ||
            initializedLectureRef.current === lectureId
          ) {
            return;
          }

          setChats(chatsList);

          if (chatsList.length > 0) {
            const firstChat = chatsList[0];
            if (firstChat) {
              setCurrentChatId(firstChat.id);
            }
            initializedLectureRef.current = lectureId;
          } else {
            const createdChat = await createDefaultChat(lectureId);
            if (
              !mountedRef.current ||
              initializedLectureRef.current === lectureId
            ) {
              return;
            }
            if (createdChat) {
              setChats([createdChat]);
              setCurrentChatId(createdChat.id);
              initializedLectureRef.current = lectureId;
            }
          }
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          setIsLoadingChats(false);
        }
      });
  }, [lectureId, createDefaultChat]);

  // Load messages when chat changes
  React.useEffect(() => {
    if (!currentChatId) {
      setIsLoadingMessages(false);
      return;
    }

    const chatIdForRequest = currentChatId;

    // Always reload messages when switching chats to ensure fresh data
    // Even if messages are cached, reload to prevent stale data issues
    setIsLoadingMessages(true);

    getMessages(lectureId, chatIdForRequest)
      .then(({ data, error }) => {
        // Double-check we're still mounted and this is still the current chat
        if (!mountedRef.current || currentChatId !== chatIdForRequest) {
          return;
        }

        if (error) {
          logger.error("Failed fetching messages:", error);
          // Set empty array on error to prevent showing stale messages
          setChatMessages((prev) => ({
            ...prev,
            [chatIdForRequest]: [],
          }));
          return;
        }
        if (data) {
          const messagesList: ChatMessage[] = data.map((msg) => ({
            id: msg.id || "",
            role: (msg.role as "user" | "assistant") || "user",
            parts:
              msg.parts?.map((p) => ({
                type: "text",
                text: p.text || "",
              })) || [],
            createdAt: msg.created_at,
          }));
          setChatMessages((prev) => ({
            ...prev,
            [chatIdForRequest]: messagesList,
          }));
        } else {
          // Handle case where data is undefined
          setChatMessages((prev) => ({
            ...prev,
            [chatIdForRequest]: [],
          }));
        }
      })
      .finally(() => {
        if (mountedRef.current && currentChatId === chatIdForRequest) {
          setIsLoadingMessages(false);
        }
      });
  }, [lectureId, currentChatId]);

  const handleChatChange = React.useCallback((newChatId: string) => {
    setCurrentChatId(newChatId);
  }, []);

  const handleChatsChange = React.useCallback(
    async (newChats: Chat[]) => {
      // Ensure at least one chat exists
      if (newChats.length === 0) {
        const createdChat = await createDefaultChat(lectureId);
        if (!mountedRef.current) {
          return;
        }
        if (createdChat) {
          setChats([createdChat]);
          setCurrentChatId(createdChat.id);
        }
        return;
      }

      if (!mountedRef.current) {
        return;
      }

      setChats(newChats);
      if (
        currentChatId &&
        !newChats.some((chat) => chat.id === currentChatId)
      ) {
        // If current chat was deleted, switch to the first available chat
        if (newChats.length > 0 && newChats[0]) {
          setCurrentChatId(newChats[0].id);
        } else {
          setCurrentChatId(null);
        }
      }
    },
    [lectureId, currentChatId, createDefaultChat],
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      isCreatingChatRef.current = false;
    };
  }, []);

  return {
    currentChatId,
    chats,
    chatMessages,
    isLoadingChats,
    isLoadingMessages,
    handleChatChange,
    handleChatsChange,
  };
}
