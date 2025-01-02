import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import UnoCSS from "unocss/vite";

export default defineConfig({
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  plugins: [
    UnoCSS(),
    sveltekit(),
  ],
  resolve: {
    alias: {
      $root: "./",
    },
  },
});
