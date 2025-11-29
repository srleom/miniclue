import * as React from "react";
import { logger } from "@/lib/logger";
import {
  getExplanations,
  getSignedPdfUrl,
} from "@/app/(dashboard)/(app)/_actions/lecture-actions";
import { useSupabase } from "@/hooks/use-supabase";

export function useLecturePdf(lectureId: string) {
  const supabase = useSupabase();
  const channelRef = React.useRef<
    ReturnType<typeof supabase.channel> | undefined
  >(undefined);
  const [pdfUrl, setPdfUrl] = React.useState<string>("");
  const [explanations, setExplanations] = React.useState<
    Record<number, string>
  >({});
  const [totalPageCount, setTotalPageCount] = React.useState(0);
  const [isInitialLoadComplete, setIsInitialLoadComplete] =
    React.useState(false);

  // Fetch initial PDF URL and explanations
  React.useEffect(() => {
    setIsInitialLoadComplete(false);
    const pdfPromise = getSignedPdfUrl(lectureId);
    const explanationsPromise = getExplanations(lectureId);

    pdfPromise.then(({ data, error }) => {
      if (data?.url) {
        setPdfUrl(data.url);
      } else if (error) {
        logger.error("Failed to fetch signed PDF URL:", error);
      }
    });

    explanationsPromise.then(({ data, error }) => {
      if (data) {
        const map: Record<number, string> = {};
        data.forEach((ex) => {
          if (ex.slide_number != null && ex.content) {
            map[ex.slide_number] = ex.content;
          }
        });
        setExplanations(map);
      } else if (error) {
        logger.error("Failed to fetch explanations:", error);
      }
    });

    Promise.allSettled([pdfPromise, explanationsPromise]).finally(() => {
      setIsInitialLoadComplete(true);
    });
  }, [lectureId]);

  // Subscribe to realtime explanation updates
  React.useEffect(() => {
    if (!isInitialLoadComplete || totalPageCount === 0) {
      return;
    }

    // Check if we already have all explanations or are already subscribed
    const explanationsCount = Object.keys(explanations).length;
    if (explanationsCount >= totalPageCount || channelRef.current) {
      return;
    }

    logger.subscription("Explanations", "subscribing for realtime updates");
    const channel = supabase
      .channel(`realtime:explanations:${lectureId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "explanations",
          filter: `lecture_id=eq.${lectureId}`,
        },
        ({ new: row }) => {
          logger.debug("Explanations: received slide", row.slide_number);
          setExplanations((prev) => ({
            ...prev,
            [row.slide_number]: row.content,
          }));
        },
      )
      .subscribe((_, err) => {
        if (err) {
          logger.error("Explanations: subscription error", err);
        }
      });
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        logger.debug("Unsubscribing from explanations channel");
        supabase.removeChannel(channelRef.current);
        channelRef.current = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialLoadComplete, totalPageCount, lectureId, supabase]);

  // Unsubscribe once all explanations are received
  React.useEffect(() => {
    const explanationsCount = Object.keys(explanations).length;
    if (
      totalPageCount > 0 &&
      explanationsCount >= totalPageCount &&
      channelRef.current
    ) {
      logger.debug("Explanations: all slides received, unsubscribing");
      supabase.removeChannel(channelRef.current);
      channelRef.current = undefined;
    }
  }, [explanations, totalPageCount, supabase]);

  return {
    pdfUrl,
    explanations,
    totalPageCount,
    setTotalPageCount,
  };
}
