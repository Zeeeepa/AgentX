import { defineConfig } from "vitest/config";
import { vitestCucumber } from "@deepracticex/vitest-cucumber/plugin";
import path from "node:path";

export default defineConfig({
  plugins: [
    vitestCucumber({
      features: ["dist/features/**/*.feature"],
      steps: "tests/steps",
    }),
  ],
  test: {
    globals: true,
    environment: "node",
    include: ["dist/features/**/*.feature"],
    exclude: ["**/node_modules/**", "**/cypress/**"],
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 120000, // 120 seconds (2 minutes) for real API calls
    reporters: [
      "default",
      "html",
      "json",
    ],
    outputFile: {
      html: "./test-results/index.html",
      json: "./test-results/results.json",
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "@": path.resolve(__dirname, "../"),
    },
  },
});
