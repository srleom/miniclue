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

import { ExplainerCarousel } from "./_components/carousel";

import { placeholderMarkdown } from "./constants";
import { Card, CardContent } from "@/components/ui/card";

export default function LecturePage() {
  const [pageNumber, setPageNumber] = React.useState(1);
  const [totalPageCount, setTotalPageCount] = React.useState(0);
  const [scrollSource, setScrollSource] = React.useState<
    "pdf" | "carousel" | null
  >(null);

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
          <PdfViewer
            fileUrl="/Week 9.pdf"
            pageNumber={pageNumber}
            onPageChange={handlePdfPageChange}
            onDocumentLoad={setTotalPageCount}
            scrollSource={scrollSource}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="flex flex-col pl-6">
          <Tabs
            defaultValue="explanation"
            className="flex min-h-0 flex-1 flex-col"
          >
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
