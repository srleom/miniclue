"use client";

// react
import { useState, useTransition, useEffect } from "react";

// next
import { useRouter } from "next/navigation";

// components
import { ProviderList } from "./provider-list";
import type { Provider } from "@/lib/chat/models";

interface ProviderListWrapperProps {
  initialStatus: Record<Provider, boolean>;
}

export function ProviderListWrapper({
  initialStatus,
}: ProviderListWrapperProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [apiKeysStatus, setApiKeysStatus] =
    useState<Record<Provider, boolean>>(initialStatus);

  // Update local state when initialStatus changes (after refresh)
  useEffect(() => {
    setApiKeysStatus(initialStatus);
  }, [initialStatus]);

  const handleUpdate = (provider: Provider) => {
    // Optimistically update the status
    setApiKeysStatus((prev) => ({
      ...prev,
      [provider]: true,
    }));

    startTransition(() => {
      router.refresh();
    });
  };

  return <ProviderList apiKeysStatus={apiKeysStatus} onUpdate={handleUpdate} />;
}
