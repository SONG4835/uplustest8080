// app/ 껍데기(설정·진입점)를 만든다. 이미 있는 파일은 건드리지 않는다.
// 에이전트 편집 폴더(components/·screens/)와 tokens.css는 만들지 않는다.
// 사용: node harness/scripts/scaffold.mjs [--install]
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { execSync } from "node:child_process"
import { ROOT } from "../lib/docs.mjs"

const APP = join(ROOT, "app")
const files = {
  "package.json": JSON.stringify(
    {
      name: "uplus-plans",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: { dev: "vite", build: "vite build", preview: "vite preview", typecheck: "tsc --noEmit", lint: "eslint src", test: "vitest run" },
      dependencies: { react: "^19.0.0", "react-dom": "^19.0.0", "react-router": "^7.0.0", clsx: "2.1.1" },
      devDependencies: {
        "@eslint/js": "^9.0.0",
        "@tailwindcss/vite": "^4.0.0",
        "@testing-library/dom": "^10.0.0",
        "@testing-library/react": "^16.0.0",
        "@types/node": "^22.0.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "@vitejs/plugin-react": "^6.0.0",
        eslint: "^9.0.0",
        "eslint-plugin-react-hooks": "^5.0.0",
        jsdom: "^26.0.0",
        playwright: "^1.50.0",
        tailwindcss: "^4.0.0",
        typescript: "^5.7.0",
        "typescript-eslint": "^8.0.0",
        vite: "^8.0.5",
        vitest: "^4.0.0",
      },
    },
    null,
    2,
  ) + "\n",
  "index.html": `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
    <title>요금제</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  "vite.config.ts": `/// <reference types="vitest/config" />
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
`,
  "tsconfig.json": JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        baseUrl: ".",
        paths: { "@/*": ["src/*"] },
        types: ["vite/client"],
      },
      include: ["src"],
    },
    null,
    2,
  ) + "\n",
  // S3 게이트용: 화면이 아직 없어도 컴포넌트만 타입 검사
  "tsconfig.components.json": JSON.stringify({ extends: "./tsconfig.json", include: ["src/components", "src/vite-env.d.ts"] }, null, 2) + "\n",
  "eslint.config.js": `import js from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"

export default tseslint.config(
  { ignores: ["dist", ".harness-tests"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { plugins: { "react-hooks": reactHooks }, rules: reactHooks.configs.recommended.rules },
)
`,
  "src/vite-env.d.ts": `/// <reference types="vite/client" />\n`,
  "src/index.css": `@import "tailwindcss";
@import "./styles/tokens.css";

/* scaffold 전용 전역 스타일. 390 = Design.md 기준 viewport 폭 */
body {
  margin: 0;
  background: var(--color-bg-default);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}
#root {
  max-width: 390px;
  min-height: 100vh;
  margin: 0 auto;
  background: var(--color-bg-default);
}
`,
  "src/main.tsx": `import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, Navigate, RouterProvider } from "react-router"
import { routes } from "./screens/routes"
import "./index.css"

// 진입 지점: 알 수 없는 경로는 요금제 목록으로 (screens.md 라우트 수에는 포함하지 않음)
const router = createBrowserRouter([...routes, { path: "*", element: <Navigate to="/plans" replace /> }])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
`,
}

let made = 0
for (const [rel, body] of Object.entries(files)) {
  const p = join(APP, rel)
  if (existsSync(p)) continue
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, body)
  made++
  console.log(`생성: app/${rel}`)
}
for (const d of ["src/components", "src/screens"]) mkdirSync(join(APP, d), { recursive: true })
console.log(made ? `scaffold 완료 (${made}개 생성)` : "scaffold: 이미 모두 있음 (변경 없음)")

if (process.argv.includes("--install")) {
  execSync("npm install", { cwd: APP, stdio: "inherit" })
  execSync("npx playwright install chromium", { cwd: APP, stdio: "inherit" })
}
