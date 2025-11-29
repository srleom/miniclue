"use client";

import { ArrowUpIcon } from "lucide-react";
import { memo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ModelSelectorCompact } from "./model-selector";

type ChatInputProps = {
  chatId: string;
  input: string;
  setInput: (input: string) => void;
  status: "idle" | "ready" | "submitted" | "streaming" | "error";
  sendMessage: (message: {
    role: "user";
    parts: Array<{ type: "text"; text: string }>;
  }) => void;
  stop: () => void;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
};

function PureChatInput({
  input,
  setInput,
  status,
  sendMessage,
  stop,
  selectedModelId,
  onModelChange,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [adjustHeight]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const submitForm = useCallback(() => {
    if (!input.trim() || status !== "ready") {
      if (status !== "ready") {
        toast.error("Please wait for the model to finish its response!");
      }
      return;
    }

    sendMessage({
      role: "user",
      parts: [
        {
          type: "text",
          text: input,
        },
      ],
    });

    setInput("");
    adjustHeight();
  }, [input, setInput, sendMessage, status, adjustHeight]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter") {
        if (e.nativeEvent.isComposing) {
          return;
        }

        if (e.shiftKey) {
          return;
        }

        e.preventDefault();
        submitForm();
      }
    },
    [submitForm],
  );

  return (
    <form
      className="border-border bg-background focus-within:border-border hover:border-muted-foreground/50 w-full rounded-xl border p-3 shadow-xs transition-all duration-200"
      onSubmit={(event) => {
        event.preventDefault();
        submitForm();
      }}
    >
      <div className="flex flex-row items-start gap-1 sm:gap-2">
        <Textarea
          autoFocus
          className="placeholder:text-muted-foreground max-h-[200px] min-h-[44px] w-full grow resize-none border-0 bg-transparent p-2 text-sm shadow-none ring-0 outline-none focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none dark:bg-transparent"
          data-testid="chat-input"
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          ref={textareaRef}
          rows={1}
          value={input}
        />
      </div>
      <div className="mt-2 flex items-center justify-between pt-2">
        <div className="flex items-center gap-0.5 sm:gap-0.5">
          <ModelSelectorCompact
            selectedModelId={selectedModelId}
            onModelChange={onModelChange}
          />
        </div>
        {status === "submitted" || status === "streaming" ? (
          <Button
            className="bg-foreground text-background hover:bg-foreground/90 size-8 rounded-full p-1 transition-colors duration-200"
            data-testid="stop-button"
            onClick={(event) => {
              event.preventDefault();
              stop();
            }}
            type="button"
          >
            <svg className="size-3" fill="currentColor" viewBox="0 0 16 16">
              <rect height="14" width="14" x="1" y="1" />
            </svg>
          </Button>
        ) : (
          <Button
            className={cn(
              "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground size-8 rounded-full transition-colors duration-200",
            )}
            data-testid="send-button"
            disabled={!input.trim()}
            type="submit"
          >
            <ArrowUpIcon size={14} />
          </Button>
        )}
      </div>
    </form>
  );
}

export const ChatInput = memo(PureChatInput);
