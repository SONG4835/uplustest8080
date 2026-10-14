/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // 판정 테스트는 verify.mjs가 harness/checks/에서 .harness-tests/로 복사해 실행한다
  test: { environment: "jsdom", include: [".harness-tests/**/*.test.tsx"] },
})
