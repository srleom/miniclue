"use client";

// styles
import "katex/dist/katex.min.css";

// react
import * as React from "react";

// next
import { useParams } from "next/navigation";

// third-party
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

// components
import { Card, CardContent } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PdfViewer from "@/app/(dashboard)/lecture/[lectureId]/_components/pdf-viewer";
import { ExplainerCarousel } from "./_components/carousel";
import LottieAnimation from "./_components/lottie-animation";

// lib
import { createClient } from "@/lib/supabase/client";

// code
import {
  getExplanations,
  getSignedPdfUrl,
  getSummary,
  getLecture,
} from "@/app/(dashboard)/_actions/lecture-actions";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function LecturePage() {
  const { lectureId } = useParams() as { lectureId: string };
  const [supabase] = React.useState(() => createClient());
  const channelRef = React.useRef<
    ReturnType<typeof supabase.channel> | undefined
  >(undefined);
  const [pdfUrl, setPdfUrl] = React.useState<string>("");
  const [explanations, setExplanations] = React.useState<
    Record<number, string>
  >({});
  const [pageNumber, setPageNumber] = React.useState(1);
  const [totalPageCount, setTotalPageCount] = React.useState(0);
  const [scrollSource, setScrollSource] = React.useState<
    "pdf" | "carousel" | null
  >(null);
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState<string | undefined>(undefined);
  const [summaryLoading, setSummaryLoading] = React.useState<boolean>(false);
  const [lectureStatus, setLectureStatus] = React.useState<string | undefined>(
    undefined,
  );
  const statusChannelRef = React.useRef<
    ReturnType<typeof supabase.channel> | undefined
  >(undefined);
  const summaryChannelRef = React.useRef<
    ReturnType<typeof supabase.channel> | undefined
  >(undefined);

  // ----------------------------------------
  // Section: PDF & Explanations Fetching
  // Description: Load PDF URL and initial explanations on mount
  // ----------------------------------------
  React.useEffect(() => {
    setLoading(true);
    const pdfPromise = getSignedPdfUrl(lectureId);
    const explanationsPromise = getExplanations(lectureId);

    pdfPromise.then(({ data, error }) => {
      if (data?.url) {
        setPdfUrl(data.url);
      } else if (error) {
        console.error("Failed to fetch signed PDF URL:", error);
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
        console.error("Failed to fetch explanations:", error);
      }
    });

    Promise.allSettled([pdfPromise, explanationsPromise]).finally(() => {
      setLoading(false);
    });
  }, [lectureId]);

  // ----------------------------------------
  // Section: Explanations Realtime Subscription
  // Description: Subscribe to new explanation inserts until all slides are received
  // ----------------------------------------
  React.useEffect(() => {
    // Don't run if we're still loading initial data or don't know the page count.
    if (loading || totalPageCount === 0) {
      return;
    }

    // Don't subscribe if we already have all explanations or an active channel.
    const explanationsCount = Object.keys(explanations).length;
    if (explanationsCount >= totalPageCount || channelRef.current) {
      return;
    }

    console.log("📖 Explanations: subscribing for realtime updates");
    channelRef.current = supabase
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
          console.log("📖 Explanations: received slide", row.slide_number);
          setExplanations((prev) => ({
            ...prev,
            [row.slide_number]: row.content,
          }));
        },
      )
      .subscribe((status, err) => {
        console.log("📖 Explanations: subscription status", status);
        if (err) {
          console.error("📖 Explanations: subscription error", err);
        }
      });

    // On unmount, we clean up the channel.
    return () => {
      if (channelRef.current) {
        console.log("Unsubscribing from explanations channel on unmount");
        supabase.removeChannel(channelRef.current);
        channelRef.current = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, totalPageCount, lectureId, supabase]);

  // ----------------------------------------
  // Section: Explanations Cleanup
  // Description: Unsubscribe once all explanations have been received
  // ----------------------------------------
  React.useEffect(() => {
    const explanationsCount = Object.keys(explanations).length;
    if (
      totalPageCount > 0 &&
      explanationsCount >= totalPageCount &&
      channelRef.current
    ) {
      console.log("📖 Explanations: all slides received, unsubscribing");
      supabase.removeChannel(channelRef.current);
      channelRef.current = undefined;
    }
  }, [explanations, totalPageCount, supabase]);

  // ----------------------------------------
  // Section: Status Fetch & Realtime Subscription
  // Description: Fetch initial lecture status and subscribe to updates until terminal
  // ----------------------------------------
  React.useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    console.log("⚡️ Status: fetching initial status");
    getLecture(lectureId).then(({ data, error }) => {
      if (error) {
        console.error("Failed fetching lecture:", error);
        return;
      }
      const st = data?.status;
      if (st) {
        console.log(
          "⚡️ Status: initial status '%s', subscribing for realtime updates",
          st,
        );
        setLectureStatus(st);
      }
      if (st && st !== "complete" && st !== "failed") {
        channel = supabase
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
              console.log("⚡️ Status: received update '%s'", row.status);
              setLectureStatus(row.status);
              const label = row.status
                .split("_")
                .map(
                  (word: string) =>
                    word.charAt(0).toUpperCase() + word.slice(1),
                )
                .join(" ");
              toast.info(label);
              if (row.status === "complete") {
                console.log(
                  "⚡️ Status: terminal status 'complete' reached, unsubscribing",
                );
                toast.success("Success");
                if (channel) supabase.removeChannel(channel);
              } else if (row.status === "failed") {
                console.log(
                  "⚡️ Status: terminal status 'failed' reached, unsubscribing",
                );
                toast.error("Error");
                if (channel) supabase.removeChannel(channel);
              }
            },
          )
          .subscribe((status, err) => {
            console.log("⚡️ Status: subscription status", status);
            if (err) console.error("⚡️ Status: subscription error", err);
          });
        statusChannelRef.current = channel;
      }
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
      statusChannelRef.current = undefined;
    };
  }, [lectureId, supabase]);

  // ----------------------------------------
  // Section: Summary Fetch & Realtime Subscription
  // Description: Fetch initial summary then subscribe to realtime updates if needed
  // ----------------------------------------
  React.useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    setSummaryLoading(true);
    console.log("🔖 Summary: fetching initial content");
    getSummary(lectureId)
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed fetching summary:", error);
          return;
        }
        if (data?.content) {
          setSummary(data.content);
        } else {
          console.log(
            "🔖 Summary: no initial content, subscribing for realtime updates",
          );
          channel = supabase
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
                console.log("🔖 Summary: content updated");
                setSummary(row.content);
                if (channel) {
                  supabase.removeChannel(channel);
                  summaryChannelRef.current = undefined;
                }
              },
            )
            .subscribe((status, err) => {
              console.log("🔖 Summary: subscription status", status);
              if (err) console.error("🔖 Summary: subscription error", err);
            });
          summaryChannelRef.current = channel;
        }
      })
      .finally(() => {
        setSummaryLoading(false);
      });
    return () => {
      if (channel) {
        console.log("🔖 Summary: unsubscribing from realtime updates");
        supabase.removeChannel(channel);
      }
      summaryChannelRef.current = undefined;
    };
  }, [lectureId, supabase]);

  const handlePdfPageChange = (newPage: number) => {
    setScrollSource("pdf");
    setPageNumber(newPage);
  };

  const handleCarouselPageChange = (newPage: number) => {
    setScrollSource("carousel");
    setPageNumber(newPage);
  };

  return (
    <>
      {lectureStatus !== "complete" && lectureStatus !== "failed" && (
        <Toaster />
      )}
      <div className="mx-auto h-[calc(100vh-6rem)] w-full overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel className="h-full pr-6">
            {pdfUrl ? (
              <PdfViewer
                fileUrl={pdfUrl}
                pageNumber={pageNumber}
                onPageChange={handlePdfPageChange}
                onDocumentLoad={setTotalPageCount}
                scrollSource={scrollSource}
              />
            ) : (
              <div className="text-muted-foreground flex h-full flex-col items-center justify-center rounded-lg border">
                <LottieAnimation />
              </div>
            )}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel className="flex flex-col pl-6">
            <Tabs defaultValue="explanation" className="flex min-h-0 flex-col">
              <TabsList className="w-full flex-shrink-0">
                <TabsTrigger
                  value="explanation"
                  className="hover:cursor-pointer"
                >
                  Explanation
                </TabsTrigger>
                <TabsTrigger value="summary" className="hover:cursor-pointer">
                  Summary
                </TabsTrigger>
                <TabsTrigger value="chat" className="hover:cursor-pointer">
                  Chat
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="explanation"
                className="mt-3 flex min-h-0 flex-1 flex-col"
              >
                <ExplainerCarousel
                  pageNumber={pageNumber}
                  onPageChange={handleCarouselPageChange}
                  totalPageCount={totalPageCount}
                  scrollSource={scrollSource}
                  explanations={explanations}
                />
              </TabsContent>
              <TabsContent
                value="summary"
                className="mt-3 flex min-h-0 flex-1 flex-col"
              >
                {summary === undefined || summaryLoading || summary === "" ? (
                  <div className="text-muted-foreground flex h-[calc(100vh-9.5rem)] flex-col items-center justify-center rounded-lg border">
                    <LottieAnimation />
                  </div>
                ) : (
                  <Card className="markdown-content h-[calc(100vh-9.5rem)] w-full overflow-y-auto rounded-lg py-8 shadow-none">
                    <CardContent className="px-10">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {summary}
                      </ReactMarkdown>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="chat" className="mt-3 flex-1">
                <div className="text-muted-foreground flex h-[calc(100vh-9.5rem)] flex-col items-center justify-center rounded-lg border">
                  <LottieAnimation />
                </div>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
