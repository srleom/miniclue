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
  getLecture,
  getExplanations,
} from "@/app/(dashboard)/_actions/lecture-actions";

import { ExplainerCarousel } from "./_components/carousel";

import { placeholderMarkdown } from "./constants";

export default function LecturePage() {
  const { lectureId } = useParams() as { lectureId: string };
  const supabase = createClient();
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
    // fetch lecture record and generate a signed URL for storage_path
    getLecture(lectureId).then(async ({ data, error }) => {
      if (data?.storage_path) {
        const storagePath = data.storage_path!;
        console.log("storagePath", storagePath);
        const { data: signedData, error: urlError } = await supabase.storage
          .from(process.env.SUPABASE_LOCAL_S3_BUCKET!)
          .createSignedUrl(storagePath, 60 * 60);
        if (urlError) {
          console.error("Error creating signed PDF URL:", urlError);
        } else if (signedData?.signedUrl) {
          console.log("signedData", signedData.signedUrl);
          setPdfUrl(signedData.signedUrl);
        }
      } else if (error) {
        console.error("Failed to fetch lecture:", error);
      }
    });
  }, [lectureId, supabase]);

  React.useEffect(() => {
    // initial load of existing explanations via server action
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
    // subscribe to new explanations
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
          setExplanations((prev) => ({
            ...prev,
            [row.slide_number]: row.content,
          }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [lectureId]);

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
