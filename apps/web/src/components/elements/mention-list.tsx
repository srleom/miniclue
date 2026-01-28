"use client";

import { forwardRef, useCallback, useState, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";
import type { Shortcut } from "@/lib/chat/shortcuts";

export type MentionListProps = {
  items: Shortcut[];
  command: (props: { id: string; label: string }) => void;
};

export type MentionListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [prevItems, setPrevItems] = useState(props.items);

    // Reset selection when items change
    if (props.items !== prevItems) {
      setSelectedIndex(0);
      setPrevItems(props.items);
    }

    const selectItem = useCallback(
      (index: number) => {
        const item = props.items[index];
        if (item) props.command({ id: item.id, label: item.label });
      },
      [props],
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex(
            (prev) => (prev - 1 + props.items.length) % props.items.length,
          );
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % props.items.length);
          return true;
        }
        if (event.key === "Tab") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    return (
      <div className="bg-popover text-popover-foreground animate-in fade-in zoom-in-95 w-48 overflow-hidden rounded-lg border shadow-lg">
        <div className="p-1">
          {props.items.length ? (
            props.items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => selectItem(index)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors",
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "",
                )}
                type="button"
              >
                <div className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-md">
                  <item.icon className="size-3.5" />
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            ))
          ) : (
            <div className="text-muted-foreground px-2 py-1 text-sm">
              No result
            </div>
          )}
        </div>
      </div>
    );
  },
);

MentionList.displayName = "MentionList";
