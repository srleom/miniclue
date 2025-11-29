"use client";

import * as React from "react";
import { formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";
import type { Chat } from "@/types/chat";
import { cn } from "@/lib/utils";

type ChatHistoryProps = {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  isLoading?: boolean;
  children: React.ReactNode;
};

export function ChatHistory({
  chats,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  isLoading,
  children,
}: ChatHistoryProps) {
  return (
    <DropdownMenu>
      {children}
      <DropdownMenuContent className="w-[300px]" align="end">
        <DropdownMenuLabel>Previous Chats</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-muted-foreground text-sm">Loading...</div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="text-muted-foreground text-sm">
              No previous chats found
            </div>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {chats.map((chat) => (
              <DropdownMenuItem
                key={chat.id}
                className={cn(
                  "group flex items-center justify-between gap-2",
                  currentChatId === chat.id && "bg-accent",
                )}
                onSelect={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button[type="button"]')) {
                    e.preventDefault();
                    return;
                  }
                  onSelectChat(chat.id);
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{chat.title}</div>
                  <div className="text-muted-foreground text-xs">
                    {formatDate(chat.updated_at)}
                  </div>
                </div>
                {chats.length > 1 && (
                  <button
                    className="opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
