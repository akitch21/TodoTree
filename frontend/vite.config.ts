import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // ── reactflow@11.11.4 のサブパッケージ（@reactflow/core 等）の
      //    package.json は exports.import を `dist/esm/index.mjs` に向けて
      //    いるが、実ファイルは `index.js` しかない（パッケージ側の不具合）。
      //    Vite が `@reactflow/core` を解決できない問題が出るため、
      //    ESM 実体ファイルへ明示的にエイリアスする。
      "@reactflow/core":          path.resolve(__dirname, "./node_modules/@reactflow/core/dist/esm/index.js"),
      "@reactflow/background":    path.resolve(__dirname, "./node_modules/@reactflow/background/dist/esm/index.js"),
      "@reactflow/controls":      path.resolve(__dirname, "./node_modules/@reactflow/controls/dist/esm/index.js"),
      "@reactflow/minimap":       path.resolve(__dirname, "./node_modules/@reactflow/minimap/dist/esm/index.js"),
      "@reactflow/node-resizer":  path.resolve(__dirname, "./node_modules/@reactflow/node-resizer/dist/esm/index.js"),
      "@reactflow/node-toolbar":  path.resolve(__dirname, "./node_modules/@reactflow/node-toolbar/dist/esm/index.js"),
    },
  },
  server: {
    port: 5173,
    strictPort: true, // 5173が使用中の場合はエラーにする（自動変更させない）
  },
})