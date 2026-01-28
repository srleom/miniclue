import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ lectureId: string; chatId: string }>;
  },
) {
  const { lectureId, chatId } = await params;

  const supabase = await createClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { model, parts } = body;

    if (!model || !parts || !Array.isArray(parts)) {
      return new Response("Invalid request body", { status: 400 });
    }

    const apiBaseUrl = process.env.API_BASE_URL;
    if (!apiBaseUrl) {
      return new Response("API base URL not configured", { status: 500 });
    }

    const apiUrl = `${apiBaseUrl}/lectures/${lectureId}/chats/${chatId}/stream`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        origin: process.env.NEXT_PUBLIC_FE_BASE_URL || "",
      },
      body: JSON.stringify({
        model,
        parts,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText, {
        status: response.status,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    if (!response.body) {
      return new Response("No response body", { status: 500 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
