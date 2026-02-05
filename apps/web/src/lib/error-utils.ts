/**
 * Error handling utilities for extracting user-friendly error messages.
 * This module is framework-agnostic and can be used in both server and client contexts.
 */

/**
 * Extracts a user-friendly error message from various error types.
 * Handles API ErrorModel objects, Error instances, strings, and unknown types.
 *
 * Priority order (most specific to least specific):
 * 1. errors[0].message (validation/API-specific errors)
 * 2. detail (general API error description)
 * 3. message (JavaScript Error objects)
 * 4. title (API error title)
 *
 * @param error - The error to extract a message from
 * @returns A human-readable error message string
 *
 * @example
 * // API error with errors array (highest priority - most specific)
 * getErrorMessage({
 *   detail: "Failed to store API key",
 *   errors: [{ message: "invalid API key: API key not valid" }]
 * })
 * // => "invalid API key: API key not valid"
 *
 * @example
 * // API error with detail field
 * getErrorMessage({ detail: "Invalid API key" })
 * // => "Invalid API key"
 *
 * @example
 * // Error instance
 * getErrorMessage(new Error("Connection failed"))
 * // => "Connection failed"
 *
 * @example
 * // String error
 * getErrorMessage("Something went wrong")
 * // => "Something went wrong"
 */
export function getErrorMessage(error: unknown): string {
  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle API ErrorModel objects and other object types
  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;

    // PRIORITY 1: Try errors array first (most specific validation/API errors)
    if (Array.isArray(errorObj.errors) && errorObj.errors.length > 0) {
      const firstError = errorObj.errors[0];
      if (
        firstError &&
        typeof firstError === "object" &&
        "message" in firstError
      ) {
        const message = String(firstError.message);
        if (message) {
          return message;
        }
      }
    }

    // PRIORITY 2: Try detail field (general API error description)
    if (typeof errorObj.detail === "string" && errorObj.detail) {
      return errorObj.detail;
    }

    // PRIORITY 3: Try message field (common in JS errors)
    if (typeof errorObj.message === "string" && errorObj.message) {
      return errorObj.message;
    }

    // PRIORITY 4: Try title field
    if (typeof errorObj.title === "string" && errorObj.title) {
      return errorObj.title;
    }
  }

  // Fallback
  return "An unexpected error occurred";
}
