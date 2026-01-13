"use client";

import { type ComponentProps, memo, type ReactNode } from "react";
import { Streamdown } from "streamdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        // Base settings: using prose-sm (14px) is good for chat.
        // Added 'prose-headings:font-semibold' for better definition.
        "prose prose-sm prose-neutral dark:prose-invert max-w-none",

        // Headings: Increased mt-3 to mt-6 to separate sections clearly.
        // Paragraphs: Increased my-1.5 to my-2 for slightly better readability.
        "prose-headings:mt-6 prose-headings:mb-2 prose-headings:font-semibold prose-p:leading-relaxed prose-p:my-2",

        // Lists: Added slight spacing (my-0.5) to list items so multi-line bullets are readable.
        "prose-ul:my-2 prose-li:my-0.5 prose-ul:pl-4 prose-ol:pl-4",

        // HR: Increased spacing to visually break up the message.
        "prose-hr:my-6",

        // Inline Code: Kept your settings, they are good.
        "prose-code:before:content-none prose-code:after:content-none prose-code:bg-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm prose-code:font-normal",

        // Code Blocks (Pre):
        // 1. Reset the prose-pre styles
        "prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-lg prose-pre:px-4 prose-pre:py-3 prose-pre:my-4",
        // 2. Ensure overflow handling
        "[&_pre]:max-w-full [&_pre]:overflow-x-auto",
        // 3. Reset internal code styling within pre blocks
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-mono [&_pre_code]:text-sm",

        // Tables: Added these to ensure tables don't look broken.
        "prose-th:p-2 prose-td:p-2 prose-tr:border-b prose-th:text-left prose-th:font-semibold",

        // Images: Ensure they don't overflow the chat bubble
        "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-md",
        className,
      )}
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={
        {
          t: ({ children }: { children: ReactNode }) => (
            <span className="text-muted-foreground italic">{children}</span>
          ),
          thought: ({ children }: { children: ReactNode }) => (
            <span className="text-muted-foreground italic">{children}</span>
          ),
          thinking: ({ children }: { children: ReactNode }) => (
            <span className="text-muted-foreground italic">{children}</span>
          ),
        } as unknown as NonNullable<ResponseProps["components"]>
      }
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

Response.displayName = "Response";
