"use client";

import { ArrowDownIcon, Ban } from "lucide-react";
import { memo } from "react";
import type { ChatMessage } from "@/types/chat";
import { useMessages } from "@/hooks/use-chat-messages";
import { Conversation, ConversationContent } from "./conversation";
import { PreviewMessage } from "./message";
import type { LectureStatus } from "@/hooks/use-lecture-status";

type MessagesProps = {
  chatId: string;
  status: "ready" | "submitted" | "streaming" | "error";
  messages: ChatMessage[];
  setMessages: (
    messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]),
  ) => void;
  regenerate: () => void;
  isReadonly: boolean;
  selectedModelId: string;
  isLoading?: boolean;
  lectureStatus?: LectureStatus;
  errorDetails?: Record<string, unknown>;
};

function PureMessages({
  chatId,
  status,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  isLoading,
  lectureStatus,
  errorDetails,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    scrollToBottom,
    hasSentMessage,
    statusLabel,
  } = useMessages({
    status,
    lectureStatus,
  });

  return (
    <div
      className="overscroll-behavior-contain -webkit-overflow-scrolling-touch flex-1 touch-pan-y overflow-y-scroll"
      ref={messagesContainerRef}
      style={{ overflowAnchor: "none" }}
    >
      <Conversation className="mx-auto flex h-full min-w-0 flex-col gap-4 md:gap-6">
        <ConversationContent className="flex h-full flex-col gap-4 py-4 md:gap-6">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-12 text-center">
              {lectureStatus && lectureStatus !== "complete" ? (
                <>
                  <div className="relative flex items-center justify-center">
                    {lectureStatus === "failed" ? (
                      <div className="bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-full">
                        <Ban className="text-destructive h-6 w-6 rotate-45" />
                      </div>
                    ) : (
                      <div className="border-primary/30 border-t-primary h-12 w-12 animate-spin rounded-full border-4" />
                    )}
                  </div>
                  <div className="flex max-w-sm flex-col items-center justify-center space-y-1">
                    <h3 className="font-medium">{statusLabel}</h3>
                    <p className="text-muted-foreground max-w-[240px] text-xs">
                      {lectureStatus === "failed"
                        ? "Something went wrong while processing your lecture."
                        : "This might take a while..."}
                    </p>
                    {lectureStatus === "failed" && errorDetails && (
                      <div className="bg-muted mt-4 w-full rounded-md border text-left">
                        <div className="bg-muted-foreground/10 text-muted-foreground border-b px-2 py-1 text-[10px] font-medium tracking-wider uppercase">
                          Error Details
                        </div>
                        <div className="max-h-[200px] overflow-y-auto p-3">
                          <pre className="text-muted-foreground w-full text-[10px] leading-relaxed break-words whitespace-pre-wrap">
                            {JSON.stringify(errorDetails, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="border-primary/30 border-t-primary h-10 w-10 animate-spin rounded-full border-4" />
              )}
            </div>
          ) : (
            <>
              {lectureStatus === "failed" && errorDetails && (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <div className="bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-full">
                    <Ban className="text-destructive h-6 w-6 rotate-45" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">Processing Failed</h3>
                    <p className="text-muted-foreground max-w-[240px] text-xs">
                      Something went wrong while processing your lecture.
                    </p>
                    <div className="bg-muted mt-4 w-full max-w-[600px] rounded-md border text-left">
                      <div className="bg-muted-foreground/10 text-muted-foreground border-b px-2 py-1 text-[10px] font-medium tracking-wider uppercase">
                        Error Details
                      </div>
                      <div className="max-h-[200px] overflow-y-auto p-3">
                        <pre className="text-muted-foreground w-full text-[10px] leading-relaxed break-words whitespace-pre-wrap">
                          {JSON.stringify(errorDetails, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {messages.length === 0 &&
                status !== "submitted" &&
                lectureStatus !== "failed" && (
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
            </>
          )}

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
