"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type ConversationProps = ComponentProps<"div">;

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <div
    className={cn(
      "relative flex-1 touch-pan-y overflow-y-auto will-change-scroll",
      className,
    )}
    role="log"
    {...props}
  />
);

export type ConversationContentProps = ComponentProps<"div">;

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <div className={cn("p-2", className)} {...props} />
);
