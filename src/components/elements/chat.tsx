"use client";

import { useChat } from "@ai-sdk/react";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { ChatMessage } from "@/types/chat";
import { generateUUID } from "@/lib/utils";
import { createChatTransport } from "@/lib/chat/transport";
import { DEFAULT_CHAT_MODEL } from "@/lib/chat/models";
import { ChatHeader } from "./chat-header";
import { ChatHistory } from "./chat-history";
import { Messages } from "./messages";
import { ChatInput } from "./chat-input";
import type { Chat } from "@/types/chat";
import { logger } from "@/lib/logger";
import type { LectureStatus } from "@/hooks/use-lecture-status";
import { getUserModels } from "@/app/(dashboard)/_actions/user-actions";
import { Button } from "@/components/ui/button";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { History, MessageSquare, Cpu, Key } from "lucide-react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() ?? null;
  }
  return null;
}

type ChatComponentProps = {
  lectureId: string;
  chatId: string | null;
  initialMessages?: ChatMessage[];
  onChatChange: (chatId: string) => void;
  chats: Chat[];
  onChatsChange: (chats: Chat[]) => void | Promise<void>;
  isLoadingChats?: boolean;
  disabled?: boolean;
  lectureStatus?: LectureStatus;
};

export function ChatComponent({
  lectureId,
  chatId,
  initialMessages = [],
  onChatChange,
  chats,
  onChatsChange,
  isLoadingChats,
  disabled,
  lectureStatus,
}: ChatComponentProps) {
  const [currentModelId, setCurrentModelId] = React.useState(() => {
    const cookieModel = getCookie("chat-model");
    return cookieModel ?? DEFAULT_CHAT_MODEL;
  });
  const [input, setInput] = React.useState("");
  const [availableModels, setAvailableModels] = React.useState<
    { id: string; name: string; enabled: boolean }[]
  >([]);
  const [isLoadingModels, setIsLoadingModels] = React.useState(true);
  const [hasOpenAIKey, setHasOpenAIKey] = React.useState<boolean | null>(null);

  // Fetch user's model availability
  React.useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const { data, error } = await getUserModels();

        if (error || !data) {
          logger.error("Failed to fetch models for chat", {
            error,
          });
          return;
        }

        const hasOpenAI =
          data.providers?.some((p) => p.provider === "openai") ?? false;
        setHasOpenAIKey(hasOpenAI);

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

  // Ensure selected model is valid
  React.useEffect(() => {
    if (enabledModels.length === 0) {
      return;
    }
    const exists = enabledModels.some((m) => m.id === currentModelId);
    if (!exists) {
      setCurrentModelId(enabledModels[0]?.id ?? currentModelId);
    }
  }, [enabledModels, currentModelId]);

  const hasAvailableModels = enabledModels.length > 0;
  const isEffectivelyDisabled = disabled || isLoadingModels;

  // Use ref to ensure transport always uses the latest model
  const currentModelIdRef = React.useRef(currentModelId);
  React.useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const transport = React.useMemo(() => {
    if (!chatId) return null;
    // Use ref to get current model at call time, not creation time
    return createChatTransport(
      lectureId,
      chatId,
      () => currentModelIdRef.current,
    );
  }, [lectureId, chatId]);

  // Normalize initial messages from database to ensure they have correct structure
  // SDK handles streaming messages correctly, but initial messages from DB might be incomplete
  const normalizedInitialMessages = React.useMemo(() => {
    return initialMessages.map((msg) => {
      // Ensure parts array exists and has at least one element
      if (!msg.parts || !Array.isArray(msg.parts) || msg.parts.length === 0) {
        return {
          ...msg,
          parts: [{ type: "text" as const, text: "" }],
        };
      }
      // Ensure all parts have correct structure
      return {
        ...msg,
        parts: msg.parts.map((part) => ({
          type: (part.type || "text") as "text",
          text: typeof part.text === "string" ? part.text : "",
        })),
      };
    });
  }, [initialMessages]);

  const { messages, setMessages, sendMessage, status, stop, regenerate } =
    useChat<ChatMessage>({
      id: chatId || undefined,
      messages: normalizedInitialMessages,
      generateId: generateUUID,
      transport: transport || undefined,
      onError: (error) => {
        logger.error("Chat error:", error);
        toast.error(error.message || "An error occurred");
      },
    });

  // Track previous status to detect when streaming completes
  const prevStatusRef = React.useRef(status);

  // Check for title update when streaming completes and this was the first message
  React.useEffect(() => {
    // Check if streaming just completed (status changed from streaming to something else)
    const prevStatus = String(prevStatusRef.current);
    const currentStatus = String(status);
    const justFinishedStreaming =
      prevStatus === "streaming" && currentStatus !== "streaming";

    // Check if this was the first message (user + assistant = 2 messages)
    const isFirstMessage = messages.length === 2;

    // Update ref AFTER checking (so next render can detect the change)
    prevStatusRef.current = status;

    if (justFinishedStreaming && isFirstMessage && chatId) {
      // This was the first message - poll for updated title with retries
      const checkTitle = async (attempt = 1, maxAttempts = 5) => {
        try {
          const { getChat } = await import(
            "@/app/(dashboard)/(app)/_actions/chat-actions"
          );
          const { data: updatedChat } = await getChat(lectureId, chatId);
          if (
            updatedChat &&
            updatedChat.title &&
            updatedChat.title !== "New Chat"
          ) {
            // Title found - update local chats state
            const updatedChats = chats.map((chat) =>
              chat.id === chatId
                ? { ...chat, title: updatedChat.title || chat.title }
                : chat,
            );
            await onChatsChange(updatedChats);
          } else if (attempt < maxAttempts) {
            // Title not ready yet - retry with exponential backoff
            const delay = Math.min(500 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
            setTimeout(() => checkTitle(attempt + 1, maxAttempts), delay);
          }
        } catch (error) {
          logger.error("[Title Update] Failed to fetch updated chat title", {
            error,
            attempt,
            chatId,
          });
          // Retry on error if attempts remaining
          if (attempt < maxAttempts) {
            const delay = Math.min(500 * Math.pow(2, attempt - 1), 5000);
            setTimeout(() => checkTitle(attempt + 1, maxAttempts), delay);
          }
        }
      };

      // Start polling after initial delay
      setTimeout(() => checkTitle(), 500);
    }
  }, [status, messages.length, chatId, lectureId, chats, onChatsChange]);

  // Sync initialMessages with useChat's internal state when chatId or initialMessages change
  // This ensures messages are properly loaded when switching between chats
  React.useEffect(() => {
    if (chatId && normalizedInitialMessages.length > 0) {
      // Only update if messages are actually different to avoid unnecessary re-renders
      const currentMessageIds = new Set(messages.map((m) => m.id));
      const initialMessageIds = new Set(
        normalizedInitialMessages.map((m) => m.id),
      );

      // Check if messages are different (different IDs or different count)
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
      // If switching to a chat with no messages, clear the current messages
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, normalizedInitialMessages]);

  const handleNewChat = React.useCallback(async () => {
    try {
      const { createChat } = await import(
        "@/app/(dashboard)/(app)/_actions/chat-actions"
      );
      const { data, error } = await createChat(lectureId);

      if (error || !data || !data.id) {
        toast.error(error || "Failed to create chat");
        return;
      }

      // Add the new chat to the chats list
      const newChat: Chat = {
        id: data.id,
        lecture_id: data.lecture_id || lectureId,
        title: data.title || "New Chat",
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      };
      await onChatsChange([newChat, ...chats]);

      onChatChange(data.id);
      setMessages([]);
    } catch {
      toast.error("Failed to create chat");
    }
  }, [lectureId, chats, onChatChange, onChatsChange, setMessages]);

  const handleDeleteChat = React.useCallback(
    async (idToDelete: string) => {
      // Prevent deletion of the last chat
      if (chats.length <= 1) {
        toast.error(
          "Cannot delete the last chat. Each lecture must have at least one chat.",
        );
        return;
      }

      try {
        const { deleteChat } = await import(
          "@/app/(dashboard)/(app)/_actions/chat-actions"
        );
        const { error } = await deleteChat(lectureId, idToDelete);

        if (error) {
          toast.error(error);
          return;
        }

        const remainingChats = chats.filter((chat) => chat.id !== idToDelete);
        onChatsChange(remainingChats);
        toast.success("Chat deleted successfully");

        if (chatId === idToDelete) {
          // Switch to the first remaining chat
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

  if (!chatId) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center space-y-6 text-center">
          <div className="bg-muted flex size-16 items-center justify-center rounded-full">
            <MessageSquare className="text-muted-foreground size-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              No chat selected
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Create a new chat to start a conversation with your AI assistant
            </p>
          </div>
          <Button onClick={handleNewChat} size="lg">
            <MessageSquare className="size-4" />
            New chat
          </Button>
        </div>
      </div>
    );
  }

  // Show message if OpenAI key is not provided
  if (!isLoadingModels && hasOpenAIKey === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center space-y-6 text-center">
          <div className="bg-muted flex size-16 items-center justify-center rounded-full">
            <Key className="text-muted-foreground size-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              OpenAI API key required
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              MiniClue requires an OpenAI API key to process lectures and
              provide intelligent answers. Please add your key in settings to
              start chatting.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/settings/api-key">
              <Key className="size-4" />
              Add API key
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show message if no models are available
  if (!isLoadingModels && !hasAvailableModels) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center space-y-6 text-center">
          <div className="bg-muted flex size-16 items-center justify-center rounded-full">
            <Cpu className="text-muted-foreground size-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              No AI models available
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You need to enable at least one model to use chat features. Go to
              settings to configure your AI models.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/settings/models">
              <Cpu className="size-4" />
              Add models
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ChatHeader
        onNewChat={handleNewChat}
        disabled={isEffectivelyDisabled}
        historyTrigger={
          <ChatHistory
            currentChatId={chatId}
            isLoading={isLoadingChats}
            onDeleteChat={handleDeleteChat}
            onSelectChat={onChatChange}
            chats={chats}
          >
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="gap-2"
                disabled={isEffectivelyDisabled}
              >
                <History className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </ChatHistory>
        }
      />

      <Messages
        chatId={chatId}
        isReadonly={false}
        messages={messages}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        setMessages={setMessages}
        status={status}
        isLoading={isEffectivelyDisabled}
        lectureStatus={lectureStatus}
      />

      <div className="bg-background sticky bottom-0 z-10 flex w-full gap-2 pb-3 md:pb-4">
        <ChatInput
          chatId={chatId}
          input={input}
          selectedModelId={currentModelId}
          onModelChange={setCurrentModelId}
          sendMessage={sendMessage}
          setInput={setInput}
          status={status}
          stop={stop}
          availableModels={enabledModels}
          disabled={isEffectivelyDisabled}
        />
      </div>
    </div>
  );
}
