"use client";

import { EditorContent } from "@tiptap/react";
import { ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModelSelectorCompact } from "./model-selector";
import type { MessagePart } from "@/types/chat";
import { useChatInput } from "@/hooks/use-chat-input";
import { MentionList } from "./mention-list";

type ChatInputProps = {
  chatId: string;
  input: string;
  setInput: (input: string) => void;
  status: "ready" | "submitted" | "streaming" | "error";
  sendMessage: (message: { role: "user"; parts: MessagePart[] }) => void;
  stop: () => void;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  availableModels?: { id: string; name: string }[];
  disabled?: boolean;
  pageNumber?: number;
};

export function ChatInput({
  input,
  setInput,
  status,
  sendMessage,
  stop,
  selectedModelId,
  onModelChange,
  availableModels,
  disabled,
  pageNumber,
}: ChatInputProps) {
  const { editor, suggestionData, componentRef, menuStyle, handleSendMessage } =
    useChatInput({
      input,
      setInput,
      sendMessage,
      pageNumber,
      disabled,
      className: cn(
        "min-h-[44px] w-full max-h-60 overflow-y-auto outline-none p-2 text-sm",
        // --- Placeholder Styles ---
        "[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
        "[&_p.is-editor-empty:first-child]:before:text-muted-foreground",
        "[&_p.is-editor-empty:first-child]:before:float-left",
        "[&_p.is-editor-empty:first-child]:before:pointer-events-none",
        "[&_p.is-editor-empty:first-child]:before:h-0",
      ),
    });

  if (!editor) {
    return (
      <div className="bg-muted/20 min-h-[44px] w-full animate-pulse rounded-xl border" />
    );
  }

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "border-border bg-background focus-within:border-border hover:border-muted-foreground/50 w-full rounded-xl border p-3 shadow-xs transition-all duration-200",
          disabled && "bg-muted/50 cursor-not-allowed opacity-70",
        )}
      >
        <div className="relative">
          <EditorContent editor={editor} />
          {editor.isEmpty && (
            <div className="text-muted-foreground/60 pointer-events-none absolute top-2 right-2 flex items-center gap-1.5 text-sm">
              <span className="bg-muted/50 text-muted-foreground flex h-5 items-center justify-center rounded border px-1.5 font-mono text-[10px] font-medium">
                @
              </span>
              <span>for tools</span>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between pt-2">
          <ModelSelectorCompact
            selectedModelId={selectedModelId}
            onModelChange={onModelChange}
            models={availableModels}
            disabled={disabled}
          />
          {status === "streaming" || status === "submitted" ? (
            <Button
              className="bg-foreground text-background hover:bg-foreground/90 size-8 rounded-full p-1 transition-colors duration-200"
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
              disabled={editor.isEmpty || disabled}
              onClick={handleSendMessage}
              type="submit"
            >
              <ArrowUpIcon size={14} />
            </Button>
          )}
        </div>
      </div>

      {suggestionData && (
        <div style={menuStyle}>
          <MentionList
            ref={componentRef}
            items={suggestionData.items}
            command={suggestionData.command}
          />
        </div>
      )}
    </div>
  );
}
