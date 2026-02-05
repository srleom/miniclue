import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { createChatTransport } from "@/lib/chat/transport";
import { DEFAULT_CHAT_MODEL } from "@/lib/chat/constants";
import { getUserModels } from "@/app/(dashboard)/_actions/user-actions";
import { getErrorMessage } from "@/lib/utils";
import type { ChatMessage, Chat, MessagePart } from "@/types/chat";

// --- Utility: Title Polling ---
async function pollForTitleUpdate(
  lectureId: string,
  chatId: string,
  onTitleFound: (newTitle: string) => void,
) {
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { getChat } =
        await import("@/app/(dashboard)/(app)/_actions/chat-actions");

      const { data: updatedChat } = await getChat(lectureId, chatId);

      if (updatedChat?.title && updatedChat.title !== "New Chat") {
        onTitleFound(updatedChat.title);
        return;
      }

      if (attempt < maxAttempts) {
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 5000);
        await wait(delay);
      }
    } catch (error) {
      logger.error("[Title Update] Failed to fetch updated chat title", {
        error,
        attempt,
        chatId,
      });
      if (attempt < maxAttempts) await wait(1000);
    }
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() ?? null;
  }
  return null;
}

export type UseChatLogicProps = {
  lectureId: string;
  chatId: string | null;
  initialMessages?: ChatMessage[];
  chats: Chat[];
  onChatChange: (chatId: string) => void;
  onChatsChange: (chats: Chat[]) => void | Promise<void>;
};

export function useChatLogic({
  lectureId,
  chatId,
  initialMessages = [],
  chats,
  onChatChange,
  onChatsChange,
}: UseChatLogicProps) {
  // --- State ---
  const [currentModelId, setCurrentModelId] = React.useState(() => {
    const cookieModel = getCookie("chat-model");
    return cookieModel ?? DEFAULT_CHAT_MODEL;
  });

  const [input, setInput] = React.useState("");
  const [availableModels, setAvailableModels] = React.useState<
    { id: string; name: string; enabled: boolean }[]
  >([]);
  const [isLoadingModels, setIsLoadingModels] = React.useState(true);
  const [hasGeminiKey, setHasGeminiKey] = React.useState<boolean | null>(null);

  // --- Model Fetching ---
  React.useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const { data, error } = await getUserModels();

        if (error || !data) {
          logger.error("Failed to fetch models for chat", { error });
          return;
        }

        const hasGemini =
          data.providers?.some((p) => p.provider === "gemini") ?? false;
        setHasGeminiKey(hasGemini);

        const models =
          data.providers?.flatMap(
            (p) =>
              p.models
                ?.map((m) => ({
                  id: m.id ?? "",
                  name: m.name ?? m.id ?? "",
                  enabled: Boolean(m.enabled),
                }))
                .filter((m) => m.id !== "") ?? [],
          ) ?? [];

        setAvailableModels(models);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  const enabledModels = React.useMemo(
    () => availableModels.filter((m) => m.enabled),
    [availableModels],
  );

  React.useEffect(() => {
    if (enabledModels.length === 0) return;
    const exists = enabledModels.some((m) => m.id === currentModelId);
    if (!exists) {
      setCurrentModelId(enabledModels[0]?.id ?? currentModelId);
    }
  }, [enabledModels, currentModelId]);

  // --- Transport & Messages ---
  const currentModelIdRef = React.useRef(currentModelId);
  React.useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const transport = React.useMemo(() => {
    if (!chatId) return null;
    return createChatTransport(
      lectureId,
      chatId,
      () => currentModelIdRef.current,
    );
  }, [lectureId, chatId]);

  const normalizedInitialMessages = React.useMemo(() => {
    return initialMessages.map((msg): ChatMessage => {
      const parts =
        msg.parts && Array.isArray(msg.parts) && msg.parts.length > 0
          ? msg.parts.map((part: MessagePart): MessagePart => {
              if (part.type === "data-reference") {
                return {
                  type: "data-reference",
                  data: {
                    ...part.data,
                    text: part.data.text,
                  },
                };
              }
              return {
                type: "text",
                text: part.text,
              };
            })
          : [{ type: "text" as const, text: "" }];

      return {
        ...msg,
        content: msg.content ?? "",
        parts,
      };
    });
  }, [initialMessages]);

  const {
    messages,
    setMessages,
    sendMessage: sendMessageFromSDK,
    status,
    stop,
    regenerate,
  } = useChat<ChatMessage>({
    id: chatId || undefined,
    initialMessages: normalizedInitialMessages,
    // @ts-expect-error - version mismatch between ai@5 and ai@6 in the workspace
    transport: transport || undefined,
    body: { modelId: currentModelId },
    onError: (error: Error) => {
      logger.error("Chat error:", error);
      toast.error(getErrorMessage(error));
    },
    onFinish: async (event: { messages: ChatMessage[] }) => {
      const history = (event.messages as ChatMessage[]) || [];
      if (history.length === 2 && chatId) {
        await pollForTitleUpdate(lectureId, chatId, (newTitle) => {
          const updatedChats = chats.map((chat) =>
            chat.id === chatId ? { ...chat, title: newTitle } : chat,
          );
          onChatsChange(updatedChats);
        });
      }
    },
  });

  // Wrapper to adapt message format from ChatInput to useChat format
  const sendMessage = React.useCallback(
    (message: { role: "user"; parts: MessagePart[] }) => {
      // Extract text content from parts for compatibility
      const textContent = message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join(" ");

      // Create ChatMessage format expected by useChat
      const chatMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: textContent,
        parts: message.parts,
      };

      sendMessageFromSDK(chatMessage);
    },
    [sendMessageFromSDK],
  );

  const convertedMessages = React.useMemo(() => {
    return (messages as ChatMessage[]).map((msg) => {
      if (msg.parts && Array.isArray(msg.parts)) {
        return {
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content || "",
          parts: msg.parts as MessagePart[],
          createdAt: msg.createdAt,
        } as ChatMessage;
      }
      const textContent = msg.content || "";
      return {
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        content: textContent,
        parts: textContent
          ? [{ type: "text" as const, text: textContent }]
          : [{ type: "text" as const, text: "" }],
        createdAt: msg.createdAt,
      } as ChatMessage;
    });
  }, [messages]);

  React.useEffect(() => {
    if (chatId && normalizedInitialMessages.length > 0) {
      const currentMessageIds = new Set(messages.map((m) => m.id));
      const initialMessageIds = new Set(
        normalizedInitialMessages.map((m) => m.id),
      );

      if (
        currentMessageIds.size !== initialMessageIds.size ||
        ![...currentMessageIds].every((id) => initialMessageIds.has(id))
      ) {
        setMessages(normalizedInitialMessages);
      }
    } else if (
      chatId &&
      normalizedInitialMessages.length === 0 &&
      messages.length > 0
    ) {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, normalizedInitialMessages]);

  // --- Handlers ---
  const handleNewChat = React.useCallback(async () => {
    try {
      const { createChat } =
        await import("@/app/(dashboard)/(app)/_actions/chat-actions");
      const { data, error } = await createChat(lectureId);

      if (error || !data || !data.id) {
        toast.error(getErrorMessage(error));
        return;
      }

      const newChat: Chat = {
        id: data.id,
        lecture_id: data.lecture_id || lectureId,
        title: data.title || "New Chat",
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      };

      await onChatsChange([newChat, ...chats]);
      onChatChange(data.id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [lectureId, chats, onChatChange, onChatsChange]);

  const handleDeleteChat = React.useCallback(
    async (idToDelete: string) => {
      if (chats.length <= 1) {
        toast.error(
          "Cannot delete the last chat. Each lecture must have at least one chat.",
        );
        return;
      }

      try {
        const { deleteChat } =
          await import("@/app/(dashboard)/(app)/_actions/chat-actions");
        const { error } = await deleteChat(lectureId, idToDelete);

        if (error) {
          toast.error(getErrorMessage(error));
          return;
        }

        const remainingChats = chats.filter((chat) => chat.id !== idToDelete);
        onChatsChange(remainingChats);
        toast.success("Chat deleted successfully");

        if (chatId === idToDelete) {
          if (remainingChats.length > 0 && remainingChats[0]) {
            onChatChange(remainingChats[0].id);
          }
        }
      } catch {
        toast.error("Failed to delete chat");
      }
    },
    [lectureId, chatId, chats, onChatChange, onChatsChange],
  );

  return {
    // State
    currentModelId,
    setCurrentModelId,
    input,
    setInput,
    enabledModels,
    isLoadingModels,
    hasGeminiKey,
    // Chat SDK
    messages: convertedMessages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    // Handlers
    handleNewChat,
    handleDeleteChat,
  };
}
