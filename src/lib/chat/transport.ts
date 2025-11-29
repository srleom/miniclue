import type { ChatTransport, UIMessageChunk } from "ai";
import type { ChatMessage } from "@/types/chat";
import { logger } from "@/lib/logger";

export function createChatTransport(
  lectureId: string,
  chatId: string,
  model: string | (() => string),
): ChatTransport<ChatMessage> {
  const getModel = typeof model === "function" ? model : () => model;
  return {
    async sendMessages({ messages }) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== "user") {
        throw new Error("Last message must be from user");
      }

      const parts = lastMessage.parts
        .filter((part) => part.type === "text")
        .map((part) => ({
          type: "text",
          text: part.text || "",
        }));

      // Get current model at call time, not creation time
      const currentModel = getModel();

      const response = await fetch(
        `/api/lectures/${lectureId}/chats/${chatId}/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: currentModel,
            parts,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stream error: ${errorText}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Convert SSE stream to ReadableStream of UIMessageChunk
      return new ReadableStream({
        async start(controller) {
          let buffer = "";

          try {
            while (true) {
              const { value, done } = await reader.read();

              if (done) {
                controller.close();
                break;
              }

              if (value) {
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const data = line.slice(6);
                    if (data.trim() === "") continue;

                    // Handle [DONE] marker
                    if (data.trim() === "[DONE]") {
                      logger.debug("[Transport] Stream done ([DONE] marker)");
                      controller.close();
                      return;
                    }

                    try {
                      const parsed = JSON.parse(data);
                      logger.debug("[Transport] Received SSE chunk", parsed);

                      // Handle AI SDK Data Stream Protocol format
                      // Forward all protocol parts to the SDK - it needs them to properly initialize message structure
                      switch (parsed.type) {
                        case "start":
                          // Message start - SDK will create message internally, but we forward this for protocol compliance
                          logger.debug("[Transport] Message start", {
                            messageId: parsed.messageId,
                          });
                          // Don't forward start part - SDK creates message internally with custom transport
                          break;

                        case "text-start":
                          // Text part start - forward to SDK so it can initialize the part
                          logger.debug("[Transport] Text start", {
                            id: parsed.id,
                          });
                          controller.enqueue(
                            parsed as UIMessageChunk<ChatMessage>,
                          );
                          break;

                        case "text-delta":
                          // Text delta - forward to SDK with partIndex so it knows which part to update
                          if (
                            parsed.delta !== undefined &&
                            parsed.delta !== null
                          ) {
                            const chunk = {
                              type: "text-delta",
                              id: parsed.id,
                              delta: String(parsed.delta),
                              partIndex: 0, // Always update the first (and only) text part
                            } as UIMessageChunk<ChatMessage>;
                            logger.debug(
                              "[Transport] Enqueueing text-delta",
                              chunk,
                            );
                            controller.enqueue(chunk);
                          }
                          break;

                        case "text-end":
                          // Text part end - forward to SDK
                          logger.debug("[Transport] Text end", {
                            id: parsed.id,
                          });
                          controller.enqueue(
                            parsed as UIMessageChunk<ChatMessage>,
                          );
                          break;

                        case "finish":
                          // Message finish - forward to SDK, then close
                          logger.debug("[Transport] Message finish");
                          controller.enqueue(
                            parsed as UIMessageChunk<ChatMessage>,
                          );
                          controller.close();
                          return;

                        default:
                          // Handle legacy format for backward compatibility
                          if (parsed.done) {
                            logger.debug(
                              "[Transport] Stream done (legacy format)",
                            );
                            controller.close();
                            return;
                          }
                          if (
                            parsed.content !== undefined &&
                            parsed.content !== null
                          ) {
                            // Convert legacy format to protocol format
                            const chunk = {
                              type: "text-delta",
                              delta: String(parsed.content),
                            } as UIMessageChunk<ChatMessage>;
                            logger.debug(
                              "[Transport] Enqueueing legacy format chunk",
                              chunk,
                            );
                            controller.enqueue(chunk);
                          } else {
                            logger.warn(
                              "[Transport] Unknown chunk type",
                              parsed,
                            );
                          }
                      }
                    } catch (error) {
                      logger.error("[Transport] Failed to parse SSE data", {
                        data,
                        error,
                      });
                    }
                  } else if (line.trim() !== "") {
                    // Handle non-SSE format (should not happen with proper protocol)
                    logger.debug("[Transport] Received non-SSE line", line);
                  }
                }
              }
            }
          } catch (error) {
            controller.error(error);
          }
        },
      });
    },
    async reconnectToStream() {
      // Reconnection not supported for this transport
      throw new Error("Reconnection not supported");
    },
  };
}
