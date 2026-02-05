#!/usr/bin/env node

/**
 * OpenAPI Spec Watcher
 *
 * Automatically regenerates TypeScript types when the backend OpenAPI spec changes.
 * Polls the backend every 2 seconds and regenerates types when changes are detected.
 *
 * Usage: node scripts/watch-openapi.js
 */

import { spawn } from "child_process";
import crypto from "crypto";

const BACKEND_URL = process.env.API_BASE_URL || "http://localhost:8080";
const OPENAPI_PATH = "/openapi.json";
const POLL_INTERVAL = 2000; // 2 seconds

let lastHash = null;
let backendHealthy = false;
let isRegenerating = false;

/**
 * Check if backend is healthy and accessible
 */
async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}${OPENAPI_PATH}`);
    if (response.ok) {
      backendHealthy = true;
      return true;
    }
    backendHealthy = false;
    return false;
  } catch {
    if (backendHealthy) {
      console.log("[OpenAPI] Backend became unreachable, pausing regeneration");
    }
    backendHealthy = false;
    return false;
  }
}

/**
 * Check if spec has changed and regenerate if needed
 */
async function checkAndRegenerate() {
  // Skip if already regenerating
  if (isRegenerating) {
    return;
  }

  try {
    // Check backend health first
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      return;
    }

    // Fetch OpenAPI spec
    const response = await fetch(`${BACKEND_URL}${OPENAPI_PATH}`);
    const spec = await response.text();

    // Calculate hash
    const hash = crypto.createHash("md5").update(spec).digest("hex");

    // Check if changed
    if (hash !== lastHash) {
      if (lastHash === null) {
        console.log("[OpenAPI] Initial spec loaded");
      } else {
        console.log("[OpenAPI] ✨ Spec changed, regenerating types...");
      }

      lastHash = hash;
      isRegenerating = true;

      // Regenerate types
      const child = spawn("pnpm", ["openapi"], {
        stdio: "inherit",
        shell: true,
      });

      child.on("close", (code) => {
        isRegenerating = false;
        if (code === 0) {
          console.log("[OpenAPI] ✅ Types regenerated successfully");
        } else {
          console.error("[OpenAPI] ❌ Type generation failed with code", code);
        }
      });

      child.on("error", (err) => {
        isRegenerating = false;
        console.error(
          "[OpenAPI] ❌ Failed to spawn regeneration process:",
          err,
        );
      });
    }
  } catch (error) {
    // Silent fail - backend might not be running
    if (backendHealthy && error instanceof Error) {
      console.error("[OpenAPI] Error checking spec:", error.message);
    }
  }
}

/**
 * Start watching
 */
function startWatching() {
  console.log("[OpenAPI] 👀 Watching for OpenAPI spec changes...");
  console.log(`[OpenAPI] Backend: ${BACKEND_URL}${OPENAPI_PATH}`);
  console.log(`[OpenAPI] Poll interval: ${POLL_INTERVAL}ms`);
  console.log(
    "[OpenAPI] Smart detection enabled - only regenerates if backend is healthy\n",
  );

  // Initial check
  checkAndRegenerate();

  // Poll regularly
  setInterval(checkAndRegenerate, POLL_INTERVAL);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[OpenAPI] Watcher stopped");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[OpenAPI] Watcher stopped");
  process.exit(0);
});

// Start
startWatching();
