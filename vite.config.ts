import { defineConfig } from "vite-plus";
import { resolve } from "node:path";
import { cpSync, mkdirSync, rmSync } from "node:fs";

const root = import.meta.dirname;
const isDev = process.argv.includes("--mode") && process.argv.includes("development");

const iife = {
  sourcemap: isDev ? ("inline" as const) : (true as const),
  minify: !isDev,
  // Safari 18+ is needed anyway for `world: "MAIN"` content scripts.
  target: ["chrome120", "safari18"],
};

export default defineConfig({
  fmt: {
    ignorePatterns: ["coverage/**", ".universal-ai-config/**"],
  },
  define: {
    __DEV__: JSON.stringify(isDev),
  },
  environments: {
    client: {
      build: {
        outDir: "dist",
        emptyOutDir: false,
        ...iife,
        rolldownOptions: {
          input: { "content-script": resolve(root, "src/content-script/index.tsx") },
          output: { format: "iife", entryFileNames: "[name].js" },
        },
      },
    },
    injected: {
      consumer: "client",
      build: {
        outDir: "dist",
        emptyOutDir: false,
        ...iife,
        rolldownOptions: {
          input: { injected: resolve(root, "src/injected/index.ts") },
          output: { format: "iife", entryFileNames: "[name].js" },
        },
      },
    },
  },
  builder: {
    async buildApp(builder) {
      // Clean dist once before building all environments
      rmSync("dist", { recursive: true, force: true });
      mkdirSync("dist", { recursive: true });
      for (const env of Object.values(builder.environments)) {
        await builder.build(env);
      }
    },
  },
  plugins: [
    {
      name: "no-test-bundle",
      resolveId(source) {
        if (/\.test\./.test(source)) {
          this.error(`Test file "${source}" must not be imported in production code`);
        }
      },
    },
    {
      name: "copy-public",
      buildStart() {
        this.addWatchFile(resolve(root, "public"));
      },
      closeBundle() {
        cpSync("public", "dist", { recursive: true });
      },
    },
  ],
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
