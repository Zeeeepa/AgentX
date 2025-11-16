import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/base/index.ts",
    "src/l1-stream/index.ts",
    "src/l2-event/index.ts",
    "src/l4-participant/index.ts",
    "src/l5-direction/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: "es2020",
});
