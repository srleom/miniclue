import * as React from "react";
import { logger } from "@/lib/logger";
import { getSummary } from "@/app/(dashboard)/(app)/_actions/lecture-actions";
import { useSupabase } from "@/hooks/use-supabase";

export function useLectureSummary(lectureId: string) {
  const supabase = useSupabase();
  const summaryChannelRef = React.useRef<
    ReturnType<typeof supabase.channel> | undefined
  >(undefined);
  const [summary, setSummary] = React.useState<string | undefined>(undefined);
  const [summaryLoading, setSummaryLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    setSummary(undefined);
    setSummaryLoading(true);
    logger.subscription("Summary", "fetching initial content");
    getSummary(lectureId)
      .then(({ data, error }) => {
        if (error) {
          logger.error("Failed fetching summary:", error);
          return;
        }
        if (data?.content) {
          setSummary(data.content);
        } else {
          logger.subscription(
            "Summary",
            "no initial content, subscribing for realtime updates",
          );
          const channel = supabase
            .channel(`realtime:summaries:${lectureId}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "summaries",
                filter: `lecture_id=eq.${lectureId}`,
              },
              ({ new: row }) => {
                logger.debug("Summary: content updated");
                setSummary(row.content);
                if (summaryChannelRef.current) {
                  logger.debug("Summary: content received, unsubscribing");
                  supabase.removeChannel(summaryChannelRef.current);
                  summaryChannelRef.current = undefined;
                }
              },
            )
            .subscribe((_, err) => {
              if (err) {
                logger.error("Summary: subscription error", err);
              }
            });
          summaryChannelRef.current = channel;
        }
      })
      .finally(() => {
        setSummaryLoading(false);
      });
    return () => {
      if (summaryChannelRef.current) {
        logger.debug("Summary: unsubscribing from realtime updates");
        supabase.removeChannel(summaryChannelRef.current);
        summaryChannelRef.current = undefined;
      }
    };
  }, [lectureId, supabase]);

  return {
    summary,
    summaryLoading,
  };
}
