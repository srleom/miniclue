"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { placeholderMarkdown } from "../constants";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export function ExplainerCarousel({
  pageNumber,
  onPageChange,
  totalPageCount,
  scrollSource,
}: {
  pageNumber: number;
  onPageChange: (page: number) => void;
  totalPageCount: number;
  scrollSource: "pdf" | "carousel" | null;
}) {
  const [api, setApi] = React.useState<CarouselApi>();

  React.useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      const selectedSlide = api.selectedScrollSnap() + 1;
      if (selectedSlide !== pageNumber) {
        onPageChange(selectedSlide);
      }
    };

    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api, pageNumber, onPageChange]);

  React.useEffect(() => {
    // Only scroll if the change came from the PDF viewer
    if (api && scrollSource === "pdf") {
      api.scrollTo(pageNumber - 1);
    }
  }, [api, pageNumber, scrollSource]);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      // Don't interfere with form inputs, textareas, or content-editable elements
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        api.scrollPrev();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        api.scrollNext();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [api]);

  const memoizedCarouselContent = React.useMemo(() => {
    return (
      <CarouselContent className="-mt-0 h-full basis-full">
        {Array.from({ length: totalPageCount || 1 }).map((_, index) => (
          <CarouselItem
            key={index}
            className="h-full basis-full overflow-y-auto pt-0"
          >
            <Card className="markdown-content h-full w-full overflow-y-auto rounded-lg py-8">
              <CardContent className="px-10">
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {placeholderMarkdown}
                </ReactMarkdown>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    );
  }, [totalPageCount]);

  return (
    <Carousel
      opts={{
        align: "start",
        axis: "y",
        duration: 20,
      }}
      orientation="vertical"
      className="h-full w-full"
      setApi={setApi}
    >
      {memoizedCarouselContent}
      <div className="absolute right-6 bottom-6 z-10 flex items-center space-x-4">
        <p className="text-muted-foreground text-sm">
          {pageNumber} / {totalPageCount}
        </p>
        <div className="flex space-x-2">
          <CarouselPrevious className="!static !translate-x-0" />
          <CarouselNext className="!static !translate-x-0" />
        </div>
      </div>
    </Carousel>
  );
}
