// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        strategies: "generateSW",
        filename: "sw.js",
        manifest: false,
        devOptions: { enabled: false },
        workbox: {
          navigateFallbackDenylist: [/^\/~oauth/],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: { cacheName: "soja-tru-pages", networkTimeoutSeconds: 4 },
            },
            {
              urlPattern: ({ url }) => url.origin === self.location.origin && /\.[a-f0-9]{8,}\.(js|css)$/.test(url.pathname),
              handler: "CacheFirst",
              options: { cacheName: "soja-tru-assets" },
            },
            {
              urlPattern: ({ url }) => url.pathname === "/prices.json",
              handler: "NetworkFirst",
              options: { cacheName: "soja-tru-price", networkTimeoutSeconds: 3 },
            },
            {
              urlPattern: ({ url }) => url.origin === self.location.origin && (/\.(onnx|wasm|mp3)$/.test(url.pathname) || url.pathname.startsWith("/__l5e/assets-v1/")),
              handler: "CacheFirst",
              options: { cacheName: "soja-tru-field-assets" },
            },
          ],
          globPatterns: ["**/*.{js,css,html,png,webmanifest,json,mp3,onnx}"],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        },
      }),
    ],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
