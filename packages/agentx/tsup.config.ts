import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  external: ["@agentxjs/core", "@agentxjs/mono-driver", "@agentxjs/node-platform", "reconnecting-websocket", "ws", "commonxjs"],
});
