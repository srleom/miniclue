"use client";

// react
import { useState } from "react";

// components
import { BYOKTransitionDialog } from "./byok-transition-dialog";

export function APIKeyHeader() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">API Keys</h1>
        <p className="text-muted-foreground mt-2">
          Bring your own keys (BYOK) from LLM providers.{" "}
          <span
            role="button"
            onClick={() => setDialogOpen(true)}
            className="text-primary cursor-default hover:underline"
          >
            Learn why we&apos;re transitioning to a BYOK model.
          </span>
        </p>
      </div>
      <BYOKTransitionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
