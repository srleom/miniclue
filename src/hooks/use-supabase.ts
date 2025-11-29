import * as React from "react";
import { createClient } from "@/lib/supabase/client";

export function useSupabase() {
  return React.useMemo(() => createClient(), []);
}
