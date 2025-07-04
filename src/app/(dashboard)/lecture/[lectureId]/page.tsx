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
} from "@/app/(dashboard)/_actions/lecture-actions";

import { ExplainerCarousel } from "./_components/carousel";
import { placeholderMarkdown } from "./constants";

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

  React.useEffect(() => {
    getSignedPdfUrl(lectureId).then(({ data, error }) => {
      if (data?.url) {
        setPdfUrl(data.url);
      } else if (error) {
        console.error("Failed to fetch signed PDF URL:", error);
      }
    });

    getExplanations(lectureId).then(({ data, error }) => {
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
  }, [lectureId]);

  React.useEffect(() => {
    const explanationsCount = Object.keys(explanations).length;

    // Condition to subscribe: we need the total count and must have fewer explanations than pages.
    if (totalPageCount > 0 && explanationsCount < totalPageCount) {
      if (!channelRef.current) {
        // If we don't have a channel, create and store one.
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
            if (status === "SUBSCRIBED") {
              console.log("Subscribed to explanations channel");
            }
            if (err) {
              console.error("Subscription error:", err);
            }
          });
      }
    } else if (explanationsCount >= totalPageCount && totalPageCount > 0) {
      // Condition to unsubscribe: we have all explanations.
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = undefined;
      }
    }

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPageCount, lectureId, supabase]);

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
            <div className="text-muted-foreground flex h-full items-center justify-center">
              Loading PDF…
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="flex flex-col pl-6">
          <Tabs defaultValue="explanation" className="flex min-h-0 flex-col">
            <TabsList className="w-full flex-shrink-0">
              <TabsTrigger value="explanation" className="hover:cursor-pointer">
                Explanation
              </TabsTrigger>
              <TabsTrigger value="summary" className="hover:cursor-pointer">
                Summary
              </TabsTrigger>
              <TabsTrigger value="notes" className="hover:cursor-pointer">
                Notes
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
              <Card className="markdown-content h-full w-full overflow-y-auto rounded-lg py-8 shadow-none">
                <CardContent className="px-10">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {placeholderMarkdown}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes" className="mt-3 flex-1">
              Change your notes here.
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
