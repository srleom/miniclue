export type Provider = "openai" | "gemini" | "anthropic" | "xai" | "deepseek";

export type MessagePart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "data-reference";
      data: {
        type: "reference";
        text?: string;
        reference: {
          type: string;
          id: string;
          metadata?: Record<string, unknown>;
        };
      };
    };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parts: MessagePart[];
  createdAt?: string | Date;
  tool_call_id?: string;
};

export type Chat = {
  id: string;
  lecture_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};
