import { FileText, type LucideIcon } from "lucide-react";

export interface Shortcut {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export const CHAT_SHORTCUTS: Shortcut[] = [
  {
    id: "current-slide",
    label: "Current Slide",
    icon: FileText,
    description: "Reference the slide you're currently viewing",
  },
];
