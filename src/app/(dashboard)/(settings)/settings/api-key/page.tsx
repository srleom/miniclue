// react
import { Suspense } from "react";

// components
import { ProviderListWrapper } from "./_components/provider-list-wrapper";

// actions
import { getUser } from "@/app/(dashboard)/_actions/user-actions";

async function APIKeyContent() {
  const { data: user, error } = await getUser();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">Failed to load user data</p>
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  const apiKeysStatus = {
    openai: user?.api_keys_provided?.openai ?? false,
    gemini: user?.api_keys_provided?.gemini ?? false,
  };

  return (
    <div className="mx-auto mt-4 flex w-full flex-col items-center md:mt-16 lg:w-3xl">
      <div className="flex w-full flex-col gap-12">
        <div>
          <h1 className="text-2xl font-semibold">API Keys</h1>
          <p className="text-muted-foreground mt-2">
            Bring your own keys from LLM providers.
          </p>
        </div>

        <div>
          <h2 className="text-muted-foreground mb-4 text-sm font-medium tracking-tighter uppercase">
            Provider Keys
          </h2>
          <ProviderListWrapper initialStatus={apiKeysStatus} />
        </div>
      </div>
    </div>
  );
}

export default function APIKeySettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-4 flex w-full flex-col items-center md:mt-16 lg:w-3xl">
          <div className="flex w-full flex-col gap-6">
            <h1 className="text-2xl font-semibold">API Keys</h1>
            <div className="flex items-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <APIKeyContent />
    </Suspense>
  );
}
