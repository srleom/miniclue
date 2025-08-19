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
import { Button } from "@/components/ui/button";
import PdfViewer from "@/app/(dashboard)/(app)/lecture/[lectureId]/_components/pdf-viewer";
import { ExplainerCarousel } from "./_components/carousel";
import LottieAnimation from "./_components/lottie-animation";

// lib
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

// hooks
import { useIsMobile } from "@/hooks/use-mobile";

// code
import {
  getExplanations,
  getSignedPdfUrl,
  getSummary,
  getLecture,
} from "@/app/(dashboard)/_actions/lecture-actions";
import { toast } from "sonner";
import { MessageCircleMore, FileText, BookOpen } from "lucide-react";

export default function LecturePage() {
  const { lectureId } = useParams() as { lectureId: string };
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = React.useState<"pdf" | "explanation">(
    "pdf",
  );
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
  const [, setLectureStatus] = React.useState<string | undefined>(undefined);
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

    logger.subscription("Explanations", "subscribing for realtime updates");
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
          logger.debug("Explanations: received slide", row.slide_number);
          setExplanations((prev) => ({
            ...prev,
            [row.slide_number]: row.content,
          }));
        },
      )
      .subscribe((status, err) => {
        if (err) {
          logger.error("Explanations: subscription error", err);
        }
      });

    // On unmount, we clean up the channel.
    return () => {
      if (channelRef.current) {
        logger.debug("Unsubscribing from explanations channel on unmount");
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
      logger.debug("Explanations: all slides received, unsubscribing");
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
    logger.subscription("Status", "fetching initial status");
    getLecture(lectureId).then(({ data, error }) => {
      if (error) {
        logger.error("Failed fetching lecture:", error);
        return;
      }
      const st = data?.status;
      if (st) {
        logger.subscription(
          "Status",
          `initial status '${st}', subscribing for realtime updates`,
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
              logger.debug("Status: received update", row.status);
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
                logger.debug(
                  "Status: terminal status 'complete' reached, unsubscribing",
                );
                toast.success("Success");
                if (channel) supabase.removeChannel(channel);
              } else if (row.status === "failed") {
                logger.debug(
                  "Status: terminal status 'failed' reached, unsubscribing",
                );
                toast.error("Error");
                if (channel) supabase.removeChannel(channel);
              }
            },
          )
          .subscribe((status, err) => {
            if (err) {
              logger.error("Status: subscription error", err);
            }
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
                logger.debug("Summary: content updated");
                setSummary(row.content);
                if (channel) {
                  supabase.removeChannel(channel);
                  summaryChannelRef.current = undefined;
                }
              },
            )
            .subscribe((status, err) => {
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
      if (channel) {
        logger.debug("Summary: unsubscribing from realtime updates");
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

  // Mobile toggle component
  const MobileToggle = () => (
    <div className="flex w-full justify-center gap-2 p-4 pt-0">
      <Button
        variant={mobileView === "pdf" ? "default" : "outline"}
        size="sm"
        onClick={() => setMobileView("pdf")}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        PDF
      </Button>
      <Button
        variant={mobileView === "explanation" ? "default" : "outline"}
        size="sm"
        onClick={() => setMobileView("explanation")}
        className="flex items-center gap-2"
      >
        <BookOpen className="h-4 w-4" />
        Explanation
      </Button>
    </div>
  );

  if (isMobile === undefined) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center rounded-lg border">
        <LottieAnimation />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full flex-col overflow-hidden">
        {isMobile && <MobileToggle />}
        <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
          <ResizablePanel
            className={cn(
              "h-full min-h-0 overflow-auto",
              !isMobile && "pr-6",
              isMobile && mobileView !== "pdf" && "hidden",
            )}
          >
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
          <ResizableHandle withHandle className={cn(isMobile && "hidden")} />
          <ResizablePanel
            className={cn(
              "flex min-h-0 flex-col",
              !isMobile && "pl-6",
              isMobile && mobileView !== "explanation" && "hidden",
            )}
          >
            <Tabs
              defaultValue="explanation"
              className="flex min-h-0 flex-1 flex-col"
            >
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
                  <div className="text-muted-foreground flex h-full flex-col items-center justify-center rounded-lg border">
                    <LottieAnimation />
                  </div>
                ) : (
                  <Card className="markdown-content flex h-full w-full overflow-y-auto rounded-lg py-6 shadow-none sm:py-8">
                    <CardContent className="px-6 sm:px-8">
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
              <TabsContent
                value="chat"
                className="mt-3 flex min-h-0 flex-1 flex-col"
              >
                <Card className="flex h-full w-full overflow-y-auto rounded-lg py-8 shadow-none">
                  <CardContent className="flex h-full flex-col items-center justify-center px-6 md:px-10">
                    <div className="space-y-4 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100">
                        <MessageCircleMore className="size-7 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold md:text-2xl">
                          Chat Feature Coming Soon
                        </h2>
                        <p className="text-sm md:max-w-lg">
                          We&apos;re building an interactive chat feature that
                          will let you ask questions about this lecture and get
                          instant AI-powered responses.
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-xs">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400"></div>
                        <span>In development</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
