#!/usr/bin/env node

const { PubSub } = require("@google-cloud/pubsub");
const dotenv = require("dotenv");
const path = require("path");

// Load root .env file
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Port calculation helpers
function getAiPort() {
  // Priority 1: Explicit override (set by conductor.json run script)
  if (process.env.CONDUCTOR_AI_PORT) {
    return process.env.CONDUCTOR_AI_PORT;
  }
  // Priority 2: Calculate from CONDUCTOR_PORT
  if (process.env.CONDUCTOR_PORT) {
    return String(parseInt(process.env.CONDUCTOR_PORT) + 2);
  }
  // Priority 3: Default fallback for non-Conductor environments
  console.warn(
    "⚠️  CONDUCTOR_PORT not set, using default AI port 8000. Run this script from Conductor for correct port allocation.",
  );
  return "8000";
}

function getBackendPort() {
  // Priority 1: Explicit override (set by conductor.json run script)
  if (process.env.CONDUCTOR_BE_PORT) {
    return process.env.CONDUCTOR_BE_PORT;
  }
  // Priority 2: Calculate from CONDUCTOR_PORT
  if (process.env.CONDUCTOR_PORT) {
    return String(parseInt(process.env.CONDUCTOR_PORT) + 1);
  }
  // Priority 3: Default fallback for non-Conductor environments
  console.warn(
    "⚠️  CONDUCTOR_PORT not set, using default backend port 8080. Run this script from Conductor for correct port allocation.",
  );
  return "8080";
}

// Configuration
const CONFIG = {
  projectId: process.env.GCP_PROJECT_ID_LOCAL,
  emulatorHost: process.env.PUBSUB_EMULATOR_HOST || "localhost:8085",
  aiPort: getAiPort(),
  bePort: getBackendPort(),
  topics: ["ingestion", "embedding", "image-analysis"],
  retentionDays: 7,
};

// Validation
function validateConfig() {
  if (!CONFIG.projectId) {
    console.error("❌ ERROR: GCP_PROJECT_ID_LOCAL is not set in .env file");
    console.error("Please create a .env file in the root directory with:");
    console.error("  GCP_PROJECT_ID_LOCAL=miniclue-gcp-local-sr");
    process.exit(1);
  }
  console.log("✓ Configuration loaded");
  console.log(`  Project ID: ${CONFIG.projectId}`);
  console.log(`  Emulator Host: ${CONFIG.emulatorHost}`);
  console.log(`  AI Service Port: ${CONFIG.aiPort}`);
  console.log(`  Backend Port: ${CONFIG.bePort}`);
}

// Set emulator host
process.env.PUBSUB_EMULATOR_HOST = CONFIG.emulatorHost;

// Initialize PubSub client
const pubsub = new PubSub({ projectId: CONFIG.projectId });

// Main function
async function main() {
  console.log("\n🚀 Starting Pub/Sub setup for local environment\n");
  validateConfig();

  await resetEmulator();
  await createResources();

  console.log("\n✅ Pub/Sub setup complete!\n");
}

// Reset emulator (delete all topics and subscriptions)
async function resetEmulator() {
  console.log(
    "\n--- Deleting all existing resources for a clean local setup ---\n",
  );

  // Delete all subscriptions first
  try {
    const [subscriptions] = await pubsub.getSubscriptions();
    for (const sub of subscriptions) {
      const subName = sub.name.split("/").pop();
      console.log(`  Deleting subscription: ${subName}`);
      try {
        await sub.delete();
      } catch (err) {
        console.warn(
          `  ⚠ Failed to delete subscription ${subName}: ${err.message}`,
        );
      }
    }
  } catch (err) {
    console.log(`  No subscriptions to delete (this is normal on first run)`);
  }

  // Delete all topics
  try {
    const [topics] = await pubsub.getTopics();
    for (const topic of topics) {
      const topicName = topic.name.split("/").pop();
      console.log(`  Deleting topic: ${topicName}`);
      try {
        await topic.delete();
      } catch (err) {
        console.warn(`  ⚠ Failed to delete topic ${topicName}: ${err.message}`);
      }
    }
  } catch (err) {
    console.log(`  No topics to delete (this is normal on first run)`);
  }

  console.log("\n--- Deletion complete. Starting creation phase. ---\n");
}

// Create all topics and subscriptions
async function createResources() {
  console.log("--- Creating topics and subscriptions ---\n");

  const pythonBaseUrl = `http://host.docker.internal:${CONFIG.aiPort}`;
  const dlqBaseUrl = `http://host.docker.internal:${CONFIG.bePort}/v1/dlq`;

  console.log(`Using Python API base URL: ${pythonBaseUrl}`);
  console.log(`Using DLQ base URL: ${dlqBaseUrl}\n`);

  for (const topicId of CONFIG.topics) {
    await createTopicWithSubscriptions(topicId, pythonBaseUrl, dlqBaseUrl);
  }
}

// Create topic and its subscriptions
async function createTopicWithSubscriptions(
  topicId,
  pythonBaseUrl,
  dlqBaseUrl,
) {
  console.log(`\n--- Ensuring resources for topic: ${topicId} (Local Env) ---`);

  const dlqTopicId = `${topicId}-dlq`;
  const subId = `${topicId}-sub`;
  const dlqSubId = `${dlqTopicId}-sub`;

  console.log(`Subscription name: ${subId}`);
  console.log(`DLQ Subscription name: ${dlqSubId}`);

  // Create DLQ topic
  const dlqTopic = await createTopic(dlqTopicId);

  // Create main topic
  const mainTopic = await createTopic(topicId);

  // Create main subscription (points to AI service)
  const mainPushEndpoint = `${pythonBaseUrl}/${topicId}`;
  console.log(`\n🎯 MAIN SUBSCRIPTION PUSH ENDPOINT: ${mainPushEndpoint}`);

  await createSubscription(subId, mainTopic, {
    pushEndpoint: mainPushEndpoint,
    ackDeadline: 180,
    retryPolicy: {
      minimumBackoff: { seconds: 10 },
      maximumBackoff: { seconds: 600 },
    },
    deadLetterPolicy: {
      deadLetterTopic: dlqTopic.name,
      maxDeliveryAttempts: 5,
    },
  });

  // Create DLQ subscription (points to backend)
  console.log(`🎯 DLQ SUBSCRIPTION PUSH ENDPOINT: ${dlqBaseUrl}`);

  await createSubscription(dlqSubId, dlqTopic, {
    pushEndpoint: dlqBaseUrl,
    ackDeadline: 180,
    retryPolicy: {
      minimumBackoff: { seconds: 10 },
      maximumBackoff: { seconds: 600 },
    },
  });
}

// Create topic helper
async function createTopic(topicId) {
  const retentionSeconds = CONFIG.retentionDays * 24 * 60 * 60;
  console.log(
    `  Creating topic: ${topicId} with ${CONFIG.retentionDays} days retention`,
  );

  const [topic] = await pubsub.createTopic(topicId, {
    messageRetentionDuration: { seconds: retentionSeconds },
  });

  console.log(`  ✓ Topic ${topicId} created`);
  return topic;
}

// Create subscription helper
async function createSubscription(subId, topic, options) {
  console.log(
    `  Creating subscription ${subId} with endpoint ${options.pushEndpoint}`,
  );

  const subscriptionOptions = {
    pushConfig: {
      pushEndpoint: options.pushEndpoint,
    },
    ackDeadlineSeconds: options.ackDeadline,
    retryPolicy: options.retryPolicy,
    expirationPolicy: {
      ttl: { seconds: 31 * 24 * 60 * 60 }, // 31 days
    },
  };

  if (options.deadLetterPolicy) {
    subscriptionOptions.deadLetterPolicy = options.deadLetterPolicy;
  }

  await pubsub.createSubscription(topic, subId, subscriptionOptions);
  console.log(`  ✓ Subscription ${subId} created`);
}

// Run
main().catch((err) => {
  console.error("\n❌ Error during setup:", err);
  process.exit(1);
});
