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
          {message.parts?.map((part, index) => {
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
                      "w-fit rounded-2xl px-3 py-2 text-right break-words text-white":
                        message.role === "user",
                      "bg-transparent px-0 py-0 text-left":
                        message.role === "assistant",
                    })}
                    data-testid="message-content"
                    style={
                      message.role === "user"
                        ? { backgroundColor: "#006cff" }
                        : undefined
                    }
                  >
                    <Response>{sanitizeText(part?.text || "")}</Response>
                  </MessageContent>
                </div>
              );
            }

            return null;
          })}
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
