"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, MessageSquare, Cpu, Key } from "lucide-react";

// Types & Utils
import type { ChatMessage, Chat } from "@/types/chat";
import type { LectureStatus } from "@/hooks/use-lecture-status";
import { useChatLogic } from "@/hooks/use-chat-logic";

// Components
import { Button } from "@/components/ui/button";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChatHeader } from "./chat-header";
import { ChatHistory } from "./chat-history";
import { Messages } from "./messages";
import { ChatInput } from "./chat-input";

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
  errorDetails?: Record<string, unknown>;
  pageNumber?: number;
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
  errorDetails,
  pageNumber,
}: ChatComponentProps) {
  const pathname = usePathname();
  // --- 1. Logic Hook ---
  const {
    currentModelId,
    setCurrentModelId,
    input,
    setInput,
    enabledModels,
    isLoadingModels,
    hasGeminiKey,
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    handleNewChat,
    handleDeleteChat,
  } = useChatLogic({
    lectureId,
    chatId,
    initialMessages,
    chats,
    onChatChange,
    onChatsChange,
  });

  const isEffectivelyDisabled = disabled || isLoadingModels;

  // --- 2. Empty States ---
  if (!chatId) {
    return (
      <EmptyStateWrapper>
        <MessageSquare className="text-muted-foreground size-8" />
        <h2 className="text-2xl font-semibold tracking-tight">
          No chat selected
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Create a new chat to start a conversation with your AI assistant
        </p>
        <Button onClick={handleNewChat} size="lg">
          <MessageSquare className="size-4" />
          New chat
        </Button>
      </EmptyStateWrapper>
    );
  }

  if (!isLoadingModels && hasGeminiKey === false) {
    return (
      <EmptyStateWrapper>
        <Key className="text-muted-foreground size-8" />
        <h2 className="text-2xl font-semibold tracking-tight">
          Google Gemini API key required
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          MiniClue requires a Google Gemini API key. Please add your key in
          settings.
        </p>
        <Button asChild size="lg">
          <Link
            href={`/settings/api-key?returnTo=${encodeURIComponent(pathname)}`}
          >
            <Key className="size-4" />
            Add API key
          </Link>
        </Button>
      </EmptyStateWrapper>
    );
  }

  if (!isLoadingModels && enabledModels.length === 0) {
    return (
      <EmptyStateWrapper>
        <Cpu className="text-muted-foreground size-8" />
        <h2 className="text-2xl font-semibold tracking-tight">
          No AI models available
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          You need to enable at least one model to use chat features.
        </p>
        <Button asChild size="lg">
          <Link
            href={`/settings/models?returnTo=${encodeURIComponent(pathname)}`}
          >
            <Cpu className="size-4" />
            Add models
          </Link>
        </Button>
      </EmptyStateWrapper>
    );
  }

  // --- 3. Main Render ---
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
                className="gap-2 focus-visible:ring-0"
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
        errorDetails={errorDetails}
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
          pageNumber={pageNumber}
        />
      </div>
    </div>
  );
}

// Simple wrapper for empty states to reduce JSX duplication
function EmptyStateWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center space-y-6 text-center">
        {React.Children.map(children, (child, i) => {
          // Wrap icon in the styled div
          if (i === 0)
            return (
              <div className="bg-muted flex size-16 items-center justify-center rounded-full">
                {child}
              </div>
            );
          // Wrap title and text in a div
          if (i === 1)
            return (
              <div className="space-y-2">
                {child}
                {children && (children as React.ReactNode[])[2]}
              </div>
            );
          if (i === 2) return null; // Handled above
          return child;
        })}
      </div>
    </div>
  );
}
