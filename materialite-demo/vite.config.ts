import { defineConfig } from "vite";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        react: resolve(__dirname, "react.html"),
        "react-differential": resolve(__dirname, "react-differential.html"),
        "react-paginated": resolve(__dirname, "react-paginated.html"),
        differential: resolve(__dirname, "differential.html"),
      },
    },
  },
});
