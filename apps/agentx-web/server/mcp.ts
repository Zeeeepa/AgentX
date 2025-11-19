/**
 * MCP Server Configuration
 *
 * Configure MCP servers for the agent.
 * See: https://modelcontextprotocol.io/
 */

export const mcpServers: Record<string, any> = {
  // PromptX MCP Server (using pre-installed CLI)
  promptx: {
    command: "promptx",
    args: ["mcp-server"],
  },

  // Example: Filesystem server
  // filesystem: {
  //   command: "npx",
  //   args: ["-y", "@anthropic-ai/mcp-server-filesystem", "/home/user/allowed-dir"],
  // },

  // Example: Memory server
  // memory: {
  //   command: "npx",
  //   args: ["-y", "@anthropic-ai/mcp-server-memory"],
  // },

  // Example: Brave Search
  // brave: {
  //   command: "npx",
  //   args: ["-y", "@anthropic-ai/mcp-server-brave-search"],
  //   env: {
  //     BRAVE_API_KEY: "your-api-key",
  //   },
  // },
};
