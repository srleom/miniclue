import * as React from "react";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { getLecture } from "@/app/(dashboard)/(app)/_actions/lecture-actions";
import { useSupabase } from "@/hooks/use-supabase";

export function useLectureStatus(lectureId: string) {
  const supabase = useSupabase();
  const statusChannelRef = React.useRef<
    ReturnType<typeof supabase.channel> | undefined
  >(undefined);

  React.useEffect(() => {
    logger.subscription("Status", "fetching initial status");
    getLecture(lectureId).then(({ data, error }) => {
      if (error) {
        logger.error("Failed fetching lecture:", error);
        return;
      }
      const st = data?.status;
      if (!st) {
        return;
      }

      if (st === "complete" || st === "failed") {
        logger.subscription(
          "Status",
          `initial status '${st}' is terminal, no subscription needed`,
        );
        return;
      }

      logger.subscription(
        "Status",
        `initial status '${st}', subscribing for realtime updates`,
      );

      const channel = supabase
        .channel(`realtime:status:${lectureId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "lectures",
            filter: `id=eq.${lectureId}`,
          },
          ({ new: row }) => {
            if (!row.status) return;
            logger.debug("Status: received update", row.status);
            const label = row.status
              .split("_")
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1),
              )
              .join(" ");
            toast.info(label);
            if (row.status === "complete") {
              logger.debug(
                "Status: terminal status 'complete' reached, unsubscribing",
              );
              toast.success("Success");
              if (statusChannelRef.current) {
                supabase.removeChannel(statusChannelRef.current);
                statusChannelRef.current = undefined;
              }
            } else if (row.status === "failed") {
              logger.debug(
                "Status: terminal status 'failed' reached, unsubscribing",
              );
              toast.error("Error");
              if (statusChannelRef.current) {
                supabase.removeChannel(statusChannelRef.current);
                statusChannelRef.current = undefined;
              }
            }
          },
        )
        .subscribe((_, err) => {
          if (err) {
            logger.error("Status: subscription error", err);
          }
        });
      statusChannelRef.current = channel;
    });

    return () => {
      if (statusChannelRef.current) {
        supabase.removeChannel(statusChannelRef.current);
        statusChannelRef.current = undefined;
      }
    };
  }, [lectureId, supabase]);
}
