import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

/**
 * Builds one standalone, single-file demo HTML page per run — which page is
 * picked by the DEMO_PAGE env var ("control" or "stage"). Deliberately one
 * entry per build, not a multi-entry build: vite-plugin-singlefile can't
 * fully resolve an import shared between two entries' chunks (it inlines the
 * shared chunk as its own separate inline <script type="module">, but the
 * importing script still has a static `import "./shared-chunk.js"` that has
 * no file to resolve against once everything is inlined, so it 404s at
 * runtime). A single-entry build has nothing to share, so nothing dangles.
 * Separate from vite.config.ts so this never touches the real dev server or
 * the live /control and /stage build.
 */
const page = process.env.DEMO_PAGE;
if (page !== "control" && page !== "stage") {
  throw new Error('Set DEMO_PAGE=control or DEMO_PAGE=stage to build a demo page.');
}

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: `dist-demo/${page}`,
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: path.resolve(__dirname, `demo/${page}.html`),
    },
  },
});
