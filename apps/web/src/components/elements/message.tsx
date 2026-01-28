"use client";

import { motion } from "motion/react";
import { memo } from "react";
import type { HTMLAttributes } from "react";
import type { ChatMessage } from "@/types/chat";
import { cn, sanitizeText } from "@/lib/utils";
import { Response } from "./response";

type MessageContentProps = HTMLAttributes<HTMLDivElement>;

const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "text-foreground flex flex-col gap-2 overflow-hidden px-4 py-3 text-sm",
      "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground",
      "group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground",
      "is-user:dark",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

type PreviewMessageProps = {
  chatId: string;
  message: ChatMessage;
  isLoading: boolean;
  setMessages: (
    messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]),
  ) => void;
  regenerate: () => void;
  isReadonly: boolean;
  requiresScrollPadding: boolean;
};

const PurePreviewMessage = ({
  message,
  requiresScrollPadding,
}: PreviewMessageProps) => {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="group/message w-full"
      data-role={message.role}
      data-testid={`message-${message.role}`}
      initial={{ opacity: 0 }}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": message.role === "user",
          "justify-start": message.role === "assistant",
        })}
      >
        {/* {message.role === "assistant" && (
          <div className="bg-background ring-border -mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ring-1">
            <SparklesIcon size={14} />
          </div>
        )} */}

        <div
          className={cn("flex flex-col", {
            "gap-2 md:gap-4": message.parts?.some(
              (p) => p.type === "text" && p.text?.trim(),
            ),
            "min-h-96": message.role === "assistant" && requiresScrollPadding,
            "w-full":
              message.role === "assistant" &&
              message.parts?.some((p) => p.type === "text" && p.text?.trim()),
            "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]":
              message.role === "user",
          })}
        >
          {message.role === "user" ? (
            <MessageContent
              className="flex w-fit flex-row flex-wrap items-center rounded-2xl px-3 py-2 text-right break-words text-white"
              data-testid="message-content"
              style={{ backgroundColor: "#006cff" }}
            >
              {message.parts?.map((part, index) => {
                if (part.type === "text") {
                  const text = part.text || "";
                  // Regex to find all REF_X patterns
                  const refRegex = /REF_\d+/g;
                  const tokens = [];
                  let lastIndex = 0;
                  let match;

                  while ((match = refRegex.exec(text)) !== null) {
                    // Push text before the match
                    if (match.index > lastIndex) {
                      tokens.push(text.substring(lastIndex, match.index));
                    }

                    const refMarker = match[0];
                    // Find the metadata for this marker
                    const refPart = message.parts?.find(
                      (p) =>
                        p.type === "data-reference" &&
                        p.data?.text === refMarker,
                    );

                    if (refPart && refPart.type === "data-reference") {
                      const slideId = refPart.data.reference?.id;
                      tokens.push(
                        <span
                          key={`ref-${match.index}`}
                          className="inline-flex items-center rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white sm:text-xs"
                        >
                          Slide {String(slideId ?? "?")}
                        </span>,
                      );
                    } else {
                      // Fallback: if no metadata found, keep the text
                      tokens.push(refMarker);
                    }
                    lastIndex = refRegex.lastIndex;
                  }

                  // Push remaining text
                  if (lastIndex < text.length) {
                    tokens.push(text.substring(lastIndex));
                  }

                  return (
                    <span key={index} className="whitespace-pre-line">
                      {tokens.map((token, i) =>
                        typeof token === "string" ? (
                          <span key={i}>{sanitizeText(token)}</span>
                        ) : (
                          token
                        ),
                      )}
                    </span>
                  );
                }
                // data-reference parts are skipped here (metadata only)
                return null;
              })}
            </MessageContent>
          ) : (
            message.parts?.map((part, index) => {
              if (!part || typeof part !== "object") {
                return null;
              }

              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === "text") {
                return (
                  <div key={key}>
                    <MessageContent
                      className={cn({
                        "bg-transparent px-0 py-0 text-left":
                          message.role === "assistant",
                      })}
                      data-testid="message-content"
                    >
                      <Response>{sanitizeText(part?.text || "")}</Response>
                    </MessageContent>
                  </div>
                );
              }

              if (
                type === "data-reference" &&
                part.data?.type === "reference"
              ) {
                const slideId = part.data.reference?.id;
                return (
                  <div key={key} className="flex justify-start">
                    <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium sm:text-xs">
                      Slide {String(slideId ?? "?")}
                    </span>
                  </div>
                );
              }

              return null;
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const PreviewMessage = memo(PurePreviewMessage);

export const ThinkingMessage = () => {
  const role = "assistant";

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="group/message w-full"
      data-role={role}
      data-testid="message-assistant-loading"
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-start gap-3">
        {/* <div className="bg-background ring-border -mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ring-1">
          <SparklesIcon size={14} />
        </div> */}

        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="text-muted-foreground p-0 text-sm">Thinking...</div>
        </div>
      </div>
    </motion.div>
  );
};
