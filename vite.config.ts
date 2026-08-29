import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: [
      "worker-configuration.d.ts",
      "mockups/**",
      "docs/**",
      ".cursor/**",
      ".vscode/**",
    ],
  },
  lint: {
    ignorePatterns: ["worker-configuration.d.ts"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  plugins: lazyPlugins(() => [react(), ...(process.env.VITEST ? [] : [cloudflare()])]),
  test: {
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
