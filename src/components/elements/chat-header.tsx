"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatHeaderProps = {
  onNewChat: () => void;
  historyTrigger: React.ReactNode;
  className?: string;
};

export function ChatHeader({
  onNewChat,
  historyTrigger,
  className,
}: ChatHeaderProps) {
  return (
    <div className={cn("flex items-center justify-end", className)}>
      <div className="text-muted-foreground flex items-center gap-2">
        <Button
          onClick={onNewChat}
          size="icon"
          variant="ghost"
          className="gap-2"
        >
          <Plus className="size-4" />
        </Button>
        {historyTrigger}
      </div>
    </div>
  );
}
