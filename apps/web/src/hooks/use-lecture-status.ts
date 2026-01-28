import * as React from "react";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { getLecture } from "@/app/(dashboard)/(app)/_actions/lecture-actions";
import { useSupabase } from "@/hooks/use-supabase";

export type LectureStatus =
  | "uploading"
  | "pending_processing"
  | "parsing"
  | "processing"
  | "complete"
  | "failed"
  | null;

export function useLectureStatus(lectureId: string) {
  const supabase = useSupabase();
  const [lectureStatus, setLectureStatus] = React.useState<LectureStatus>(null);
  const [lectureTitle, setLectureTitle] = React.useState<string | null>(null);
  const [errorDetails, setErrorDetails] = React.useState<Record<
    string,
    unknown
  > | null>(null);
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

      if (data?.title) {
        setLectureTitle(data.title);
      }

      const st = data?.status as LectureStatus;
      if (!st) {
        return;
      }

      setLectureStatus(st);

      if (st === "failed") {
        logger.debug(
          "Lecture failed, error details:",
          data?.embedding_error_details,
        );
        if (data?.embedding_error_details) {
          setErrorDetails(data.embedding_error_details);
        } else {
          logger.warn(
            "Lecture status is failed but no embedding_error_details found",
          );
        }
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
            const newStatus = row.status as LectureStatus;
            setLectureStatus(newStatus);
            logger.debug("Status: received update", newStatus);
            if (row.status === "complete") {
              logger.debug(
                "Status: terminal status 'complete' reached, unsubscribing",
              );
              toast.success("Lecture processed successfully");
              if (statusChannelRef.current) {
                supabase.removeChannel(statusChannelRef.current);
                statusChannelRef.current = undefined;
              }
            } else if (row.status === "failed") {
              logger.debug(
                "Status: terminal status 'failed' reached, unsubscribing",
              );
              if (row.embedding_error_details) {
                setErrorDetails(row.embedding_error_details);
              }
              toast.error("Lecture processing failed. See details in chat.");
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

  return { lectureStatus, lectureTitle, errorDetails };
}
