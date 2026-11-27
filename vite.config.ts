import { defineConfig, PluginOption } from "vite";
import { enterDevPlugin, enterProdPlugin } from 'vite-plugin-enter-dev';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [
    ...enterProdPlugin(),
  ];
  if (mode === 'development') {
    plugins.push(...enterDevPlugin());
  }
  return {
    server: {
      host: "::",
      port: 8080,
      // Allows the dev server to be reached through a tunnel (e.g. cloudflared)
      // whose hostname doesn't match localhost; fine for local/dev use only.
      allowedHosts: true,
      // The show's own backend (server/index.ts) — REST + Socket.IO — runs
      // as a separate local process; proxying it under this same origin
      // means one tunnel exposes both, and the browser never needs to know
      // it's a different port.
      proxy: {
        "/api": "http://localhost:4000",
        "/socket.io": {
          target: "http://localhost:4000",
          ws: true,
        },
      },
    },
    plugins: plugins.filter(Boolean) as PluginOption[],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: '/',
    build: {
      outDir: 'dist',
    }
  };
});