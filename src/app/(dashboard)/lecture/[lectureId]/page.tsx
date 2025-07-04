"use client";

import * as React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PdfViewer from "@/app/(dashboard)/lecture/[lectureId]/_components/pdf-viewer";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getExplanations,
  getSignedPdfUrl,
  getSummary,
} from "@/app/(dashboard)/_actions/lecture-actions";

import { ExplainerCarousel } from "./_components/carousel";
import LottieAnimation from "./_components/lottie-animation";

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
  const [activeTab, setActiveTab] = React.useState<string>("explanation");
  const [summary, setSummary] = React.useState<string | undefined>(undefined);
  const [summaryLoading, setSummaryLoading] = React.useState<boolean>(false);

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

  // Effect 1: Subscribe to the channel when the component is ready.
  // We disable the lint rule because we intentionally want this effect to run only
  // once when loading is finished, not every time `explanations` changes.
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

    console.log("Subscribing to explanations channel");
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
          console.log("New explanation:", row);
          setExplanations((prev) => ({
            ...prev,
            [row.slide_number]: row.content,
          }));
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.error("Subscription error:", err);
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

  // Effect 2: Unsubscribe when all explanations have been received.
  React.useEffect(() => {
    const explanationsCount = Object.keys(explanations).length;
    if (
      totalPageCount > 0 &&
      explanationsCount >= totalPageCount &&
      channelRef.current
    ) {
      console.log("All explanations received, unsubscribing.");
      supabase.removeChannel(channelRef.current);
      channelRef.current = undefined;
    }
  }, [explanations, totalPageCount, supabase]);

  React.useEffect(() => {
    if (activeTab !== "summary" || summary !== undefined) {
      return;
    }
    setSummaryLoading(true);
    getSummary(lectureId)
      .then(({ data, error }) => {
        if (data?.content) {
          setSummary(data.content);
        } else if (error) {
          console.error("Failed to fetch summary:", error);
          setSummary("");
        } else {
          setSummary("");
        }
      })
      .finally(() => {
        setSummaryLoading(false);
      });
  }, [activeTab, summary, lectureId]);

  const handlePdfPageChange = (newPage: number) => {
    setScrollSource("pdf");
    setPageNumber(newPage);
  };

  const handleCarouselPageChange = (newPage: number) => {
    setScrollSource("carousel");
    setPageNumber(newPage);
  };

  return (
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
          <Tabs
            defaultValue="explanation"
            onValueChange={(value) => setActiveTab(value)}
            className="flex min-h-0 flex-col"
          >
            <TabsList className="w-full flex-shrink-0">
              <TabsTrigger value="explanation" className="hover:cursor-pointer">
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
              {summary === undefined || summaryLoading ? (
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
  );
}
