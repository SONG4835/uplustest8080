// ============================================================================
// vite.config.ts : Vite(빌드 도구/개발 서버)의 설정 파일
// ----------------------------------------------------------------------------
// - 이 파일은 "개발 서버를 어떻게 띄울지", "배포용 빌드를 어떻게 만들지"를 정합니다.
// - 맨 아래쪽에는 Figma Make 환경에서 쓰는 '플러그인'들이 정의되어 있습니다.
//   (플러그인 = Vite에 기능을 덧붙이는 작은 부품)
// ============================================================================

// Vite 설정 함수와, 타입스크립트용 타입(HtmlTagDescriptor, Plugin)을 가져옵니다.
// `type` 이 붙은 것은 "타입 정보만" 가져오는 것이라 실제 실행 코드에는 포함되지 않습니다.
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
// React 코드를 Vite에서 사용할 수 있게 해주는 공식 플러그인
import react from '@vitejs/plugin-react'
// Tailwind CSS(클래스 이름으로 스타일을 입히는 CSS 도구)를 Vite에 연결하는 플러그인
import tailwindcss from '@tailwindcss/vite'
// Node.js 기본 모듈: 파일/폴더 경로를 다룰 때 사용
import path from 'node:path'

// 사이트 제목, 설명, 아이콘 등 사이트 설정이 담긴 JSON 파일을 가져옵니다.
import siteConfiguration from './.figma/make/site.json'


// Vite config — https://vitejs.dev/config/
// defineConfig: 설정 객체를 쓸 때 자동완성/타입 검사를 도와주는 도우미 함수
// `mode` 는 실행 모드입니다. (예: 'development', 'production')
export default defineConfig(({ mode }) => {
  // .figma/make/deploy-preview passes `--mode development` for cached-preview builds.
  // 개발 모드일 때만 소스맵(에러 위치를 원본 코드로 보여주는 지도)을 만들기 위한 스위치
  const emitSourcemaps = mode === 'development'

  return {
    // base: 배포된 사이트의 기본 주소 경로.
    // 환경변수 FIGMA_PUBLIC_URL 이 있으면 그 주소를 쓰고, 없으면 '/' (최상위)를 씁니다.
    base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/',
    // 빌드(배포용 파일 생성) 관련 설정
    build: {
      // 개발 모드면 소스맵을 파일 안에 포함('inline'), 아니면 만들지 않음(false)
      sourcemap: emitSourcemaps ? 'inline' : false,
      // 코드 압축(minify): 개발 모드가 아닐 때만 압축해서 용량을 줄임
      minify: !emitSourcemaps,
    },
    // 사용할 플러그인 목록 (위에서 아래 순서대로 적용)
    plugins: [
react(),                                  // React 지원
      tailwindcss(),                          // Tailwind CSS 지원
      figmaSiteConfiguration(siteConfiguration), // site.json 내용을 HTML에 반영 (아래에 정의)
      figmaErrorOverlayReplay(),              // 에러 화면이 사라지지 않게 다시 보여줌 (아래에 정의)
      figmaReactRefreshBoundaryFallback(),    // 화면 갱신이 꼬일 때 강제 새로고침 (아래에 정의)
      // 스토리(*.stories.*) 파일들을 모아 미리보기 페이지에 제공 (아래에 정의)
      figmaMakeKitPlugin({ storiesGlob: '/src/**/*.stories.{ts,tsx,js,jsx}' }),
    ],
    // 경로 해석 설정
    resolve: {
      alias: {
        // import 할 때 '@/components/Button' 처럼 쓰면 src 폴더 기준으로 찾아줌 (경로 단축키)
        '@': path.resolve(__dirname, './src'),
      },
    },
    // 개발 서버(npm run dev) 설정
    server: {
      // 접속 허용 주소. '0.0.0.0'은 같은 네트워크의 다른 기기에서도 접속 가능하다는 뜻
      host: process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0',
      // 포트 번호. 환경변수 PORT가 없으면 8443 사용 (parseInt: 문자열을 숫자로 변환)
      port: parseInt(process.env.PORT || '8443'),
      // true면 포트가 이미 사용 중일 때 다른 포트로 넘어가지 않고 오류를 냄
      strictPort: true,
      // 파일 변경 감시 설정
      watch: {
        // 변경을 감시하지 않을 파일 패턴 (.figma 폴더는 무시)
        ignored: [
          '**/.figma/**',
],
      },
    },
    // 빌드 결과물을 로컬에서 미리 보는 서버(vite preview) 설정
    preview: {
      host: process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
    },
  }
})

// site.json 파일이 가질 수 있는 항목들의 "모양(타입)"을 정의합니다.
// 항목 이름 뒤의 `?` 는 "있어도 되고 없어도 된다(선택)"는 뜻입니다.
type FigmaSiteConfiguration = {
  title?: string        // 브라우저 탭에 보이는 사이트 제목
  description?: string  // 사이트 설명 (검색 결과 등에 사용)
  language?: string     // 사이트 언어 코드 (예: 'ko', 'en')
  robots?: {
    index?: boolean     // false면 검색엔진이 이 사이트를 수집하지 못하게 함
  }
  icons?: {
    icon?: string       // 파비콘(탭의 작은 아이콘) 주소
  }
  openGraph?: {
    image?: string      // SNS 공유 시 보이는 대표 이미지 주소
  }
  analytics?: {
    googleAnalyticsId?: string // 구글 애널리틱스(방문자 분석) ID
  }
  customScripts?: {     // HTML의 각 위치에 직접 끼워 넣을 코드
    headStart?: string  // <head> 시작 부분
    headEnd?: string    // <head> 끝 부분
    bodyStart?: string  // <body> 시작 부분
    bodyEnd?: string    // <body> 끝 부분
  }
  accessibility?: {
    addBypassLinks?: boolean // true면 '본문으로 건너뛰기' 링크 추가 (접근성)
  }
}

/** Applies /.figma/make/site.json to the generated document shell. */
// [플러그인 1] site.json 의 설정을 실제 HTML(제목, 메타태그, 분석 스크립트 등)에 반영합니다.
function figmaSiteConfiguration(config: FigmaSiteConfiguration): Plugin {
  // 값에서 영문, 숫자, _, - 이외의 문자를 모두 제거 (악의적인 코드 삽입 방지용 정리)
  function sanitizeHtmlValue(value: string | undefined): string {
    return value?.replace(/[^a-zA-Z0-9_-]/g, '') || ''
  }
  // HTML에서 특별한 의미를 갖는 문자(&, <, >)를 안전한 문자로 바꿈 (예: < → &lt;)
  function escapeHtmlText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  // HTML 안의 `<!-- 슬롯이름 -->` 주석 자리를 실제 내용(content)으로 바꿔 끼움
  function replaceHtmlCommentSlot(html: string, slotName: string, content: string): string {
    return html.replace(`<!-- ${slotName} -->`, content)
  }

  // 설정값을 꺼내고, 값이 없으면(??) 기본값을 사용합니다.
  const title = config.title ?? "Figma Make App"
  const description = config.description ?? ''
  const favicon = config.icons?.icon ?? ''
  const socialImage = config.openGraph?.image ?? ''
  const language = sanitizeHtmlValue(config.language) || 'en'
  const googleAnalyticsId = sanitizeHtmlValue(config.analytics?.googleAnalyticsId)
  const headStart = config.customScripts?.headStart ?? ''
  const headEnd = config.customScripts?.headEnd ?? ''
  const bodyStart = config.customScripts?.bodyStart ?? ''
  const bodyEnd = config.customScripts?.bodyEnd ?? ''
  // 검색엔진 접근을 막는 robots.txt 내용. index가 false일 때만 내용이 생김
  const robotsTxt = config.robots?.index === false ? 'User-agent: *\nDisallow: /\n' : ''

  return {
    // 플러그인 이름 (오류 메시지 등에 표시됨)
    name: 'figma-site-configuration',
    // 개발 서버가 켜질 때 실행: /robots.txt 요청에 직접 응답하도록 설정
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // robots.txt 내용이 없거나 다른 주소 요청이면 그냥 다음 처리로 넘김
        if (!robotsTxt || req.url?.split('?')[0] !== '/robots.txt') return next()

        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(robotsTxt)
      })
    },
    // 빌드 마지막 단계에 실행: 결과물에 robots.txt 파일을 추가로 만들어 넣음
    generateBundle() {
      if (!robotsTxt) return

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: robotsTxt,
      })
    },
    // index.html 을 가공하는 단계
    transformIndexHtml: {
      order: 'pre', // 다른 처리보다 먼저 실행
      handler(html) {
        let result = html
        // HTML 안의 주석 자리(슬롯)에 언어, 제목, 사용자 코드를 채워 넣음
        result = replaceHtmlCommentSlot(result, 'figma:lang', language)
        result = replaceHtmlCommentSlot(result, 'figma:title', escapeHtmlText(title))
        result = replaceHtmlCommentSlot(result, 'figma:head-start', headStart)
        result = replaceHtmlCommentSlot(result, 'figma:head-end', headEnd)
        result = replaceHtmlCommentSlot(result, 'figma:body-start', bodyStart)
        result = replaceHtmlCommentSlot(result, 'figma:body-end', bodyEnd)

        // HTML에 새로 추가할 태그들을 이 배열에 차곡차곡 모읍니다.
        const tags: HtmlTagDescriptor[] = []
        // 설명이 있으면 <meta name="description"> 추가
        if (description) {
          tags.push({ tag: 'meta', attrs: { name: 'description', content: description }, injectTo: 'head' })
        }
        // 검색엔진 수집을 막는 설정이면 noindex 메타 태그 추가
        if (config.robots?.index === false) {
          tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' })
        }
        // 파비콘(탭 아이콘) 링크 추가
        if (favicon) {
          tags.push({ tag: 'link', attrs: { rel: 'icon', href: favicon }, injectTo: 'head' })
        }
        // 아래 og:* 태그들은 카카오톡/페이스북 등에서 링크를 공유할 때 보이는 미리보기 정보
        if (title) {
          tags.push({ tag: 'meta', attrs: { property: 'og:title', content: title }, injectTo: 'head' })
        }
        if (description) {
          tags.push({ tag: 'meta', attrs: { property: 'og:description', content: description }, injectTo: 'head' })
        }
        // 공유용 대표 이미지(og:image)와 트위터 카드 이미지 설정
        if (socialImage) {
          tags.push(
            { tag: 'meta', attrs: { property: 'og:image', content: socialImage }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:image', content: socialImage }, injectTo: 'head' },
          )
        }

        // 구글 애널리틱스 ID가 있으면 방문자 분석 스크립트 2개를 <head>에 추가
        if (googleAnalyticsId) {
          tags.push(
            {
              // 1) 구글 분석 라이브러리를 불러오는 스크립트
              tag: 'script',
              attrs: {
                async: true,
                src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
              },
              injectTo: 'head',
            },
            {
              // 2) 분석 도구를 초기화하는 스크립트 (JSON.stringify로 ID를 안전하게 문자열화)
              tag: 'script',
              children: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', ${JSON.stringify(googleAnalyticsId)});
`,
              injectTo: 'head',
            },
          )
        }

        // 접근성 옵션: 키보드/스크린리더 사용자를 위한 "본문으로 건너뛰기" 링크 추가
        if (config.accessibility?.addBypassLinks) {
          tags.push(
            {
              // 링크 모양을 정하는 CSS. 평소엔 화면 위쪽 밖에 숨어 있다가
              // 키보드로 포커스(:focus)가 오면 화면 안으로 내려옴
              tag: 'style',
              children: `
  .figma-bypass-link {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 2147483647;
    transform: translateY(-150%);
    border-radius: 6px;
    background: #111827;
    color: #fff;
    padding: 8px 12px;
    font: 600 14px/1.2 system-ui, sans-serif;
    text-decoration: none;
  }
  .figma-bypass-link:focus {
    transform: translateY(0);
  }
`,
              injectTo: 'head',
            },
            {
              // 실제 링크: 클릭하면 #root (앱의 본문 영역)로 바로 이동. <body> 맨 앞에 삽입
              tag: 'a',
              attrs: { class: 'figma-bypass-link', href: '#root' },
              children: 'Skip to content',
              injectTo: 'body-prepend',
            },
          )
        }

        // 수정된 HTML과, 추가할 태그 목록을 Vite에 돌려줌
        return {
          html: result,
          tags,
        }
      },
    },
  }
}

/**
 * Replay the most recent build error to clients that connect after
 * it was first broadcast. Vite buffers an error payload only while
 * no clients are connected and clears the buffer on the first
 * reconnect (see `bufferedMessage` in `createWebSocketServer`), so
 * if the preview iframe reloads after Vite already delivered an
 * error to a live socket, the new socket misses the payload and
 * the overlay stays hidden even though the build is still broken.
 * We intercept `ws.send` to remember the latest error and replay
 * it on every new connection; the cache clears on a successful
 * `update` or `full-reload` so a stale overlay can't survive a
 * fixed build.
 */
// [플러그인 2] 쉬운 설명:
// 코드에 오류가 나면 화면에 에러 창(오버레이)이 뜹니다. 그런데 미리보기 화면이
// 새로고침되어 다시 연결되면 에러 정보를 못 받아 창이 사라지는 문제가 있습니다.
// 이 플러그인은 "마지막 에러"를 기억해 두었다가, 새로 연결된 화면에 다시 보내줍니다.
// 오류가 고쳐져서 업데이트/새로고침이 성공하면 기억해둔 에러를 지웁니다.
function figmaErrorOverlayReplay(): Plugin {
  return {
    name: 'figma-error-overlay-replay',
    apply: 'serve', // 개발 서버에서만 동작 (배포 빌드에는 포함 안 됨)
    configureServer(server) {
      // 마지막으로 발생한 에러를 저장해 두는 변수 (없으면 null)
      let lastError: object | null = null

      // 원래의 메시지 전송 함수(ws.send)를 보관해 둠
      const origSend = server.ws.send.bind(server.ws) as (...args: any[]) => void
      // 전송 함수를 가로채서(감시용으로 교체), 보내는 내용을 살펴본 뒤 원래 함수로 전달
      server.ws.send = ((...args: any[]) => {
        const payload = args[0]
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const type = (payload as { type?: string }).type
          if (type === 'error') {
            lastError = payload as object      // 에러 메시지면 저장
          } else if (type === 'update' || type === 'full-reload') {
            lastError = null                   // 정상 갱신이면 저장된 에러 삭제
          }
        }
        return origSend(...args) // 원래 하던 대로 메시지 전송
      }) as typeof server.ws.send

      // 새 화면(브라우저)이 연결되면, 저장된 에러가 있을 경우 즉시 다시 보내줌
      server.ws.on('connection', (socket) => {
        if (lastError !== null) {
          socket.send(JSON.stringify(lastError))
        }
      })
    },
  }
}

/**
 * Reload when a module that previously defined a React Refresh boundary stops
 * defining one. This happens when an agent moves a component into a new file
 * and replaces the old module with a re-export:
 *
 *   export { default } from './app/App'
 *
 * Vite otherwise accepts the update using the previous module's HMR boundary,
 * but the re-export-only transform no longer registers a replacement for the
 * mounted component family. React reports a successful refresh while leaving
 * the old tree mounted until the page is reloaded.
 */
// [플러그인 3] 쉬운 설명:
// 개발 중에는 코드를 저장하면 화면이 자동으로 부분 갱신됩니다(HMR / React Refresh).
// 그런데 컴포넌트를 다른 파일로 옮기고 원래 파일을 '다시 내보내기(re-export)'만 하게 바꾸면,
// 갱신은 성공했다고 나오는데 화면은 예전 그대로 남는 문제가 생깁니다.
// 이 플러그인은 그런 상황을 감지하면 페이지 전체를 강제로 새로고침해 줍니다.
function figmaReactRefreshBoundaryFallback(): Plugin {
  // Vite의 모듈 정보 타입 (타입 검사에만 쓰임)
  type ModuleNode = import('vite').ModuleNode
  // 파일별로 "이전에 React Refresh 경계가 있었는지" 기록하는 표
  const hadRefreshBoundary = new Map<string, boolean>()
  // 경계가 있다가 없어진 파일들의 목록
  const lostRefreshBoundaries = new Set<string>()
  // 전체 새로고침을 요청하는 함수 (서버가 켜지면 아래에서 채워짐)
  let sendFullReload: (() => void) | null = null

  return {
    name: 'figma-react-refresh-boundary-fallback',
    apply: 'serve',   // 개발 서버에서만 동작
    enforce: 'post',  // 다른 플러그인들이 처리한 뒤 마지막에 실행
    configureServer(server) {
      // 모든 브라우저에 "전체 새로고침" 메시지를 보내는 함수를 준비
      sendFullReload = () => server.ws.send({ type: 'full-reload', path: '*' })
    },
    // 파일이 수정되어 핫 업데이트가 일어날 때마다 호출됨
    handleHotUpdate({ modules, server, timestamp }) {
      // 경계를 잃은 파일이 하나도 없으면 할 일 없음
      if (lostRefreshBoundaries.size === 0) return

      // 수정된 모듈에서 시작해, 그 모듈을 불러다 쓰는 상위 모듈들을 차례로 탐색
      const visited = new Set<ModuleNode>() // 이미 확인한 모듈 (무한 반복 방지)
      const pending = [...modules]           // 앞으로 확인할 모듈 목록
      while (pending.length > 0) {
        const current = pending.pop()
        if (!current || visited.has(current)) continue
        visited.add(current)

        // 파일 경로에서 '?' 뒤의 쿼리 부분을 제거
        const moduleId = current.id?.split('?')[0]
        // 경계를 잃은 파일을 찾았다면
        if (moduleId && lostRefreshBoundaries.has(moduleId)) {
          // 수정된 모듈들의 캐시를 무효화하고
          const invalidated = new Set<ModuleNode>()
          for (const updatedModule of modules) {
            server.moduleGraph.invalidateModule(updatedModule, invalidated, timestamp, true)
          }
          // 전체 새로고침을 요청한 뒤, 부분 업데이트는 하지 않음([] 반환)
          sendFullReload?.()
          return []
        }

        // 이 모듈을 import 하는 상위 모듈들도 탐색 대상에 추가
        pending.push(...current.importers)
      }
    },
    // 각 파일이 변환될 때마다 호출됨: 파일에 React Refresh 경계가 있는지 검사
    transform(code, id) {
      // JS/TS/JSX/TSX 파일이 아니거나 node_modules 안의 파일이면 건너뜀
      if (!/\.[jt]sx?(?:\?|$)/.test(id) || id.includes('/node_modules/')) return null

      const moduleId = id.split('?')[0] ?? id
      // 코드에 이 문구가 있으면 "React Refresh 경계가 있는 파일"로 판단
      const hasRefreshBoundary = code.includes('registerExportsForReactRefresh')
      const previousHadRefreshBoundary = hadRefreshBoundary.get(moduleId)
      // 이번 상태를 기록해서 다음 비교에 사용
      hadRefreshBoundary.set(moduleId, hasRefreshBoundary)

      // 경계가 다시 생겼다면 '잃은 목록'에서 제거
      if (hasRefreshBoundary) lostRefreshBoundaries.delete(moduleId)
      // 이전에는 있었는데 지금은 없다면 → 목록에 추가하고 곧바로 전체 새로고침
      if (previousHadRefreshBoundary && !hasRefreshBoundary) {
        lostRefreshBoundaries.add(moduleId)
        queueMicrotask(() => sendFullReload?.())
      }

      // null: 코드를 바꾸지 않고 그대로 둠 (감시만 하는 역할)
      return null
    },
  }
}

/**
 * Serves a blank render-target page at /.figma/make/kit.html that
 * the Figma preview script drives directly. The page exposes a
 * registry of every file matching `storiesGlob` on
 * window.__FIGMA__.stories so the design surface can dynamically
 * import + mount each entry into its own grid view.
 *
 * Dev-only: `apply: 'serve'` gates the plugin to `vite dev`. Prod
 * builds (`vite build`) skip it entirely so the route doesn't leak
 * into shipped bundles.
 */
// [플러그인 4] 쉬운 설명:
// 개발 서버에 /.figma/make/kit.html 이라는 "빈 도화지 페이지"를 만들어 줍니다.
// Figma 미리보기가 이 페이지에 컴포넌트(스토리) 예시들을 불러와 격자 형태로 보여줍니다.
// 어떤 스토리 파일이 있는지는 window.__FIGMA__.stories 에 목록으로 담아 둡니다.
function figmaMakeKitPlugin(options: { storiesGlob: string | string[] }): Plugin {
  // 하나만 주어져도 항상 배열로 다루도록 통일
  const storiesGlob = Array.isArray(options.storiesGlob) ? options.storiesGlob : [options.storiesGlob]
  // 이 페이지에 접속하는 주소
  const ROUTE = '/.figma/make/kit.html'
  // '가상 모듈' 이름: 실제 파일은 없지만 import 할 수 있는 가짜 파일
  const VIRTUAL_ID = 'virtual:figma-stories'
  // Vite 내부 규칙: 가상 모듈의 실제 ID는 앞에 \0 을 붙임
  const RESOLVED_ID = '\0' + VIRTUAL_ID
  // 가상 모듈의 내용: 패턴에 맞는 모든 스토리 파일을 한꺼번에 가져오는 코드 (import.meta.glob)
  const STORIES_MODULE = `export const stories = import.meta.glob(${JSON.stringify(storiesGlob)})`
  // 빈 페이지의 HTML. 스토리 목록을 window.__FIGMA__ 에 넣고 'figma.ready' 이벤트로 준비 완료를 알림
  const HTML_BOOTSTRAP = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
<div id="figma-make-kit-root"></div>
<script type="module">
  import { stories } from 'virtual:figma-stories'
  window.__FIGMA__ = Object.assign(window.__FIGMA__ ?? {}, { stories })
  window.dispatchEvent(new CustomEvent('figma.ready'))
</script>
</body>
</html>`

  return {
    name: 'figma-make-kit',
    apply: 'serve', // 개발 서버 전용 (배포 빌드에는 들어가지 않음)
    // import 'virtual:figma-stories' 요청이 오면 내부 ID로 연결
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      return null
    },
    // 가상 모듈의 실제 내용(위의 STORIES_MODULE)을 제공
    load(id) {
      if (id !== RESOLVED_ID) return null
      return STORIES_MODULE
    },
    // 개발 서버에 /.figma/make/kit.html 요청을 처리하는 코드를 추가
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        // 다른 주소 요청이면 이 코드는 무시하고 다음 처리로 넘김
        if (url.split('?')[0] !== ROUTE) return next()

        try {
          res.setHeader('Content-Type', 'text/html')
          // Vite가 HTML을 가공(필요한 스크립트 삽입 등)한 뒤 응답으로 보냄
          res.end(await server.transformIndexHtml(url, HTML_BOOTSTRAP))
        } catch (err) {
          // 오류가 나면 Vite의 오류 처리로 넘김
          next(err as Error)
        }
      })
    },
  }
}
