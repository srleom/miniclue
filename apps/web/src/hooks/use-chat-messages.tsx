import { useEffect, useMemo, useState } from "react";
import { useScrollToBottom } from "./use-scroll-to-bottom";
import type { LectureStatus } from "@/hooks/use-lecture-status";

export function useMessages({
  status,
  lectureStatus,
}: {
  status: "ready" | "submitted" | "streaming" | "error";
  lectureStatus?: LectureStatus;
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
    } else if (status === "ready") {
      // Reset when chat becomes ready (e.g., new chat or reset)
      requestAnimationFrame(() => {
        setHasSentMessage(false);
      });
    }
  }, [status]);

  useEffect(() => {
    if (status === "submitted") {
      requestAnimationFrame(() => {
        const container = containerRef.current;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    }
  }, [status, containerRef]);

  const statusLabel = useMemo(() => {
    if (!lectureStatus) return "Preparing...";
    if (lectureStatus === "failed") return "Processing Failed";
    return lectureStatus
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [lectureStatus]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
    statusLabel,
  };
}
