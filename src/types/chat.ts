export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: "text"; text: string }>;
  createdAt?: string;
};

export type Chat = {
  id: string;
  lecture_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};
