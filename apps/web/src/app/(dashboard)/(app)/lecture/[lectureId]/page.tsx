"use client";

// react
import * as React from "react";

// next
import { useParams } from "next/navigation";

// components
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import PdfViewer from "@/app/(dashboard)/(app)/lecture/[lectureId]/_components/pdf-viewer";
import LottieAnimation from "./_components/lottie-animation";
import { MobileToggle } from "./_components/mobile-toggle";
import { ChatComponent } from "@/components/elements/chat";

// lib
import { cn } from "@/lib/utils";

// hooks
import { useIsMobile } from "@/hooks/use-mobile";
import { useLecturePdf } from "@/hooks/use-lecture-pdf";
import { useLectureStatus } from "@/hooks/use-lecture-status";
import { useLectureChats } from "@/hooks/use-lecture-chats";

export default function LecturePage() {
  const { lectureId } = useParams() as { lectureId: string };

  // Mobile detection
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = React.useState<"pdf" | "chat">("chat");

  // PDF viewer state
  const [pageNumber, setPageNumber] = React.useState(1);

  // Custom hooks for lecture data
  const { pdfUrl, setTotalPageCount } = useLecturePdf(lectureId);
  const { lectureStatus, errorDetails } = useLectureStatus(lectureId);
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
              isMobile && mobileView !== "chat" && "hidden",
            )}
          >
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
              lectureStatus={lectureStatus}
              errorDetails={errorDetails ?? undefined}
              pageNumber={pageNumber}
              disabled={
                isLoadingChats ||
                isLoadingMessages ||
                lectureStatus !== "complete"
              }
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
