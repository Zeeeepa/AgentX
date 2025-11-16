/**
 * Development WebSocket Server for agentx-ui
 *
 * This server runs alongside Storybook for local UI development.
 * Provides a real Claude Agent connection for testing components.
 */

import { createAgent, createWebSocketServer } from "@deepractice-ai/agentx-node";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.test file
const envPath = resolve(__dirname, "../../agentx-node/.env.test");
config({ path: envPath });

async function startDevServer() {
  // Support both AGENT_API_KEY and ANTHROPIC_API_KEY
  const apiKey = process.env.AGENT_API_KEY || process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.AGENT_BASE_URL;

  if (!apiKey) {
    console.error("❌ Error: API key is not set");
    console.log("\nPlease set your API key in one of these ways:");
    console.log("  1. Create .env.test file in agentx-node package");
    console.log("  2. export AGENT_API_KEY='your-api-key'");
    console.log("  3. export ANTHROPIC_API_KEY='your-api-key'");
    process.exit(1);
  }

  console.log("🚀 Starting AgentX Development Server...\n");
  console.log("📝 Configuration:");
  console.log(`   API Key: ${apiKey.substring(0, 10)}...`);
  if (baseUrl) {
    console.log(`   Base URL: ${baseUrl}`);
  }
  console.log();

  // Create Agent
  const agent = createAgent(
    {
      apiKey,
      baseUrl,
      model: "claude-sonnet-4-20250514",
      systemPrompt: "You are a helpful AI assistant for UI development testing.",
    },
    {
      enableLogging: true,
      prettyLogs: true,
      logLevel: "debug",
      logDestination: resolve(__dirname, "../logs/dev-server.log"),
    }
  );

  console.log(`📄 Logs: ${resolve(__dirname, "../logs/dev-server.log")}`);

  // Create WebSocket Server
  const wsServer = createWebSocketServer({
    agent,
    port: 5200,
    host: "0.0.0.0",
  });

  console.log("✅ WebSocket Server Started");
  console.log(`   URL: ${wsServer.getUrl()}\n`);
  console.log("📦 Agent Info:");
  console.log(`   ID: ${agent.id}`);
  console.log(`   Session: ${agent.sessionId}\n`);
  console.log("💡 Ready for UI development!");
  console.log("   Run 'pnpm storybook' in another terminal\n");

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n\n🛑 Shutting down...");
    await wsServer.close();
    agent.destroy();
    console.log("✅ Server stopped");
    process.exit(0);
  });
}

startDevServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
