"use client";

import { ArrowDownIcon } from "lucide-react";
import { memo, useEffect } from "react";
import type { ChatMessage } from "@/types/chat";
import { useMessages } from "@/hooks/use-chat-messages";
import { Conversation, ConversationContent } from "./conversation";
import { PreviewMessage } from "./message";

type MessagesProps = {
  chatId: string;
  status: "idle" | "ready" | "submitted" | "streaming" | "error";
  messages: ChatMessage[];
  setMessages: (
    messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]),
  ) => void;
  regenerate: () => void;
  isReadonly: boolean;
  selectedModelId: string;
};

function PureMessages({
  chatId,
  status,
  messages,
  setMessages,
  regenerate,
  isReadonly,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    scrollToBottom,
    hasSentMessage,
  } = useMessages({
    status,
  });

  useEffect(() => {
    if (status === "submitted") {
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    }
  }, [status, messagesContainerRef]);

  return (
    <div
      className="overscroll-behavior-contain -webkit-overflow-scrolling-touch flex-1 touch-pan-y overflow-y-scroll"
      ref={messagesContainerRef}
      style={{ overflowAnchor: "none" }}
    >
      <Conversation className="mx-auto flex h-full min-w-0 flex-col gap-4 md:gap-6">
        <ConversationContent className="flex h-full flex-col gap-4 py-4 md:gap-6">
          {messages.length === 0 && status !== "submitted" && (
            <div className="flex h-full flex-col items-center justify-center py-12">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-semibold">Hello there!</h2>
                <p className="text-muted-foreground">
                  Ask me anything about the lecture.
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <PreviewMessage
              chatId={chatId}
              isLoading={
                status === "streaming" && messages.length - 1 === index
              }
              isReadonly={isReadonly}
              key={message.id}
              message={message}
              regenerate={regenerate}
              requiresScrollPadding={
                hasSentMessage && index === messages.length - 1
              }
              setMessages={setMessages}
            />
          ))}

          {/* <AnimatePresence mode="wait">
            {status === "submitted" && <ThinkingMessage key="thinking" />}
          </AnimatePresence> */}

          <div
            className="min-h-[24px] min-w-[24px] shrink-0"
            ref={messagesEndRef}
          />
        </ConversationContent>
      </Conversation>

      {!isAtBottom && (
        <button
          aria-label="Scroll to bottom"
          className="bg-background hover:bg-muted absolute bottom-40 left-1/2 z-10 -translate-x-1/2 rounded-full border p-2 shadow-lg transition-colors"
          onClick={() => scrollToBottom("smooth")}
          type="button"
        >
          <ArrowDownIcon className="size-4" />
        </button>
      )}
    </div>
  );
}

export const Messages = memo(PureMessages);
