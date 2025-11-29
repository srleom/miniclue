import { useEffect, useState } from "react";
import { useScrollToBottom } from "./use-scroll-to-bottom";

export function useMessages({
  status,
}: {
  status: "idle" | "ready" | "submitted" | "streaming" | "error";
}) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  const [hasSentMessage, setHasSentMessage] = useState(false);

  useEffect(() => {
    if (status === "submitted") {
      // Defer state update to avoid cascading renders
      requestAnimationFrame(() => {
        setHasSentMessage(true);
      });
    } else if (status === "idle" || status === "ready") {
      // Reset when chat becomes idle/ready (e.g., new chat or reset)
      requestAnimationFrame(() => {
        setHasSentMessage(false);
      });
    }
  }, [status]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  };
}
