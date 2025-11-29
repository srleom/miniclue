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
import PdfViewer from "@/app/(dashboard)/(app)/lecture/[lectureId]/_components/pdf-viewer";
import { ExplainerCarousel } from "./_components/carousel";
import LottieAnimation from "./_components/lottie-animation";
import { MobileToggle } from "./_components/mobile-toggle";
import { ChatComponent } from "@/components/elements/chat";

// lib
import { cn } from "@/lib/utils";

// hooks
import { useIsMobile } from "@/hooks/use-mobile";
import { useLecturePdf } from "@/hooks/use-lecture-pdf";
import { useLectureStatus } from "@/hooks/use-lecture-status";
import { useLectureSummary } from "@/hooks/use-lecture-summary";
import { useLectureChats } from "@/hooks/use-lecture-chats";

export default function LecturePage() {
  const { lectureId } = useParams() as { lectureId: string };

  // Mobile detection
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = React.useState<"pdf" | "explanation">(
    "pdf",
  );

  // PDF viewer state
  const [pageNumber, setPageNumber] = React.useState(1);
  const [scrollSource, setScrollSource] = React.useState<
    "pdf" | "carousel" | null
  >(null);

  // Custom hooks for lecture data
  const { pdfUrl, explanations, totalPageCount, setTotalPageCount } =
    useLecturePdf(lectureId);
  useLectureStatus(lectureId);
  const { summary, summaryLoading } = useLectureSummary(lectureId);
  const {
    currentChatId,
    chats,
    chatMessages,
    isLoadingChats,
    isLoadingMessages,
    handleChatChange,
    handleChatsChange,
  } = useLectureChats(lectureId);

  const handlePdfPageChange = (newPage: number) => {
    setScrollSource("pdf");
    setPageNumber(newPage);
  };

  const handleCarouselPageChange = (newPage: number) => {
    setScrollSource("carousel");
    setPageNumber(newPage);
  };

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
        {isMobile && (
          <MobileToggle mobileView={mobileView} onViewChange={setMobileView} />
        )}
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
              className="flex min-h-0 flex-1 flex-col gap-1"
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
                {isLoadingChats || isLoadingMessages ? (
                  <Card className="flex h-full w-full overflow-y-auto rounded-lg py-8 shadow-none">
                    <CardContent className="flex h-full flex-col items-center justify-center px-6 md:px-10">
                      <LottieAnimation />
                    </CardContent>
                  </Card>
                ) : (
                  <ChatComponent
                    chatId={currentChatId}
                    chats={chats}
                    initialMessages={
                      currentChatId ? chatMessages[currentChatId] || [] : []
                    }
                    isLoadingChats={isLoadingChats}
                    lectureId={lectureId}
                    onChatChange={handleChatChange}
                    onChatsChange={handleChatsChange}
                  />
                )}
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
