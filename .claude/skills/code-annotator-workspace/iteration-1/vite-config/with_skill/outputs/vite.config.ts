/*
 * [파일 개요] vite.config.ts
 * Vite(비트)의 설정 파일이다. Vite = React 같은 웹앱을 개발 서버로 띄우고, 배포용으로 묶어주는(빌드) 도구.
 * 비유: 앱이라는 요리를 만들 때 쓰는 "주방 설정표".
 *
 * 크게 두 부분으로 나뉜다.
 *  1) 맨 위 defineConfig(...): 포트, 경로 별칭, 빌드 옵션 등 기본 설정과 사용할 플러그인 목록.
 *  2) 아래쪽 figma... 함수 4개: Figma Make 환경에서 쓰려고 만든 직접 제작 플러그인.
 *     (플러그인 = Vite의 동작 중간에 끼어들어 기능을 덧붙이는 부품)
 */
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

import siteConfiguration from './.figma/make/site.json'


// Vite config — https://vitejs.dev/config/
// 설정을 함수로 내보낸다. mode(실행 모드: 'development' 또는 'production')를 받아 설정을 상황별로 바꿀 수 있다.
export default defineConfig(({ mode }) => {
  // .figma/make/deploy-preview passes `--mode development` for cached-preview builds.
  // 개발 모드일 때만 소스맵을 만든다. 소스맵 = 묶인(압축된) 코드와 원본 코드를 이어주는 지도라서,
  // 브라우저에서 에러가 났을 때 원본 코드의 몇 번째 줄인지 알 수 있다.
  const emitSourcemaps = mode === 'development'

  return {
    // base = 사이트가 놓일 주소 앞부분. 환경변수 FIGMA_PUBLIC_URL이 있으면 그 주소 아래에서, 없으면 루트('/')에서 서비스한다.
    // 예) FIGMA_PUBLIC_URL="https://a.com/x" -> base는 "https://a.com/x/"
    base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/',
    build: {
      // 개발 모드면 소스맵을 파일 안에 'inline'으로 포함, 아니면 만들지 않는다(배포 파일을 가볍게).
      sourcemap: emitSourcemaps ? 'inline' : false,
      // 개발 모드에서는 코드를 압축(minify)하지 않아 읽기 쉽게 두고, 배포용에서만 압축한다.
      minify: !emitSourcemaps,
    },
    // 사용할 플러그인 목록. 위에서부터 순서대로 적용된다.
    plugins: [
react(),
      tailwindcss(),
      figmaSiteConfiguration(siteConfiguration),
      figmaErrorOverlayReplay(),
      figmaReactRefreshBoundaryFallback(),
      figmaMakeKitPlugin({ storiesGlob: '/src/**/*.stories.{ts,tsx,js,jsx}' }),
    ],
    resolve: {
      // 경로 별칭: import에서 '@'를 src 폴더의 절대 경로로 쓸 수 있다.
      // 예) import Button from '@/components/Button'  ==  src/components/Button
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // 개발 서버(vite dev) 설정
    server: {
      // 0.0.0.0 = 내 컴퓨터 밖(다른 기기·컨테이너)에서도 접속 가능. 환경변수로 바꿀 수 있다.
      host: process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0',
      // 환경변수 PORT는 문자열이라 parseInt로 숫자로 바꾼다. 없으면 8443.
      port: parseInt(process.env.PORT || '8443'),
      // 포트가 이미 사용 중이면 다른 포트로 넘어가지 않고 에러로 멈춘다(주소가 고정되어야 해서).
      strictPort: true,
      watch: {
        // 파일 변경 감시에서 제외할 경로. .figma 폴더가 바뀌어도 화면을 다시 불러오지 않는다.
        ignored: [
          '**/.figma/**',
],
      },
    },
    // 빌드 결과를 미리 보는 서버(vite preview) 설정. 개발 서버와 같은 주소/포트 규칙을 쓴다.
    preview: {
      host: process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
    },
  }
})

// site.json에 들어 있는 사이트 설정의 모양(타입). 물음표(?)는 "없어도 된다"는 뜻이다.
type FigmaSiteConfiguration = {
  title?: string
  description?: string
  language?: string
  robots?: {
    index?: boolean
  }
  icons?: {
    icon?: string
  }
  openGraph?: {
    image?: string
  }
  analytics?: {
    googleAnalyticsId?: string
  }
  customScripts?: {
    headStart?: string
    headEnd?: string
    bodyStart?: string
    bodyEnd?: string
  }
  accessibility?: {
    addBypassLinks?: boolean
  }
}

/**
 * Applies /.figma/make/site.json to the generated document shell.
 *
 * site.json의 값(제목, 설명, 아이콘, 분석 코드 등)을 index.html에 끼워 넣는 플러그인.
 * 매개변수 config: site.json 내용 / 반환값: Vite 플러그인 객체.
 */
function figmaSiteConfiguration(config: FigmaSiteConfiguration): Plugin {
  // 정규식 [^a-zA-Z0-9_-]: "영문, 숫자, _, - 가 아닌 글자"를 뜻한다. 그런 글자를 모두 지워 안전한 값만 남긴다.
  // 예) 'ko"><script>' -> 'koscript'  (HTML에 끼워 넣어도 코드 주입이 불가능하도록)
  function sanitizeHtmlValue(value: string | undefined): string {
    return value?.replace(/[^a-zA-Z0-9_-]/g, '') || ''
  }
  // HTML에서 특별한 의미를 가진 &, <, > 를 일반 글자로 바꿔(이스케이프) 제목이 태그로 해석되지 않게 한다.
  // 예) 'A<B' -> 'A&lt;B'  (& 를 가장 먼저 바꿔야 이미 바뀐 &lt; 가 또 바뀌지 않는다)
  function escapeHtmlText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  // index.html 안의 자리표시자 주석(예: <!-- figma:title -->)을 실제 내용으로 바꾼다. 빈칸 채우기와 같다.
  function replaceHtmlCommentSlot(html: string, slotName: string, content: string): string {
    return html.replace(`<!-- ${slotName} -->`, content)
  }

  // `a ?? b` = a가 없으면(null/undefined) b를 쓴다. 아래 값들은 설정이 비어 있을 때의 기본값을 정한다.
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
  // robots.txt = 검색엔진 로봇에게 주는 출입 안내문. index가 false면 "모든 로봇은 전체 접근 금지" 내용을 만든다.
  const robotsTxt = config.robots?.index === false ? 'User-agent: *\nDisallow: /\n' : ''

  return {
    name: 'figma-site-configuration',
    // 개발 서버가 시작될 때 실행. 미들웨어 = 요청이 들어올 때 중간에서 먼저 처리하는 검문소 같은 함수.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // robots.txt 요청이 아니면(또는 내용이 없으면) 다음 처리자에게 넘긴다. '?' 뒤 쿼리는 떼고 경로만 비교한다.
        if (!robotsTxt || req.url?.split('?')[0] !== '/robots.txt') return next()

        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(robotsTxt)
      })
    },
    // 배포용 빌드 결과물을 만들 때 실행. 개발 서버와 달리 실제 파일이 필요하므로 robots.txt를 결과물에 추가한다.
    generateBundle() {
      if (!robotsTxt) return

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: robotsTxt,
      })
    },
    // index.html을 브라우저에 보내기 전에 가공하는 단계. order 'pre' = 다른 플러그인보다 먼저 실행.
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        // 1단계: HTML 안의 자리표시자 주석을 실제 값(언어, 제목, 사용자 스크립트)으로 교체한다.
        let result = html
        result = replaceHtmlCommentSlot(result, 'figma:lang', language)
        result = replaceHtmlCommentSlot(result, 'figma:title', escapeHtmlText(title))
        result = replaceHtmlCommentSlot(result, 'figma:head-start', headStart)
        result = replaceHtmlCommentSlot(result, 'figma:head-end', headEnd)
        result = replaceHtmlCommentSlot(result, 'figma:body-start', bodyStart)
        result = replaceHtmlCommentSlot(result, 'figma:body-end', bodyEnd)

        // 2단계: <head> 등에 새로 추가할 태그 목록을 모은다. 값이 있는 항목만 조건문으로 골라 넣는다.
        // 예) description이 "안녕"이면 <meta name="description" content="안녕"> 태그가 추가된다.
        const tags: HtmlTagDescriptor[] = []
        if (description) {
          tags.push({ tag: 'meta', attrs: { name: 'description', content: description }, injectTo: 'head' })
        }
        if (config.robots?.index === false) {
          tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' })
        }
        if (favicon) {
          tags.push({ tag: 'link', attrs: { rel: 'icon', href: favicon }, injectTo: 'head' })
        }
        // og:/twitter: 태그 = 카카오톡·SNS에 링크를 공유할 때 보이는 미리보기 카드(제목, 설명, 이미지)용 정보.
        if (title) {
          tags.push({ tag: 'meta', attrs: { property: 'og:title', content: title }, injectTo: 'head' })
        }
        if (description) {
          tags.push({ tag: 'meta', attrs: { property: 'og:description', content: description }, injectTo: 'head' })
        }
        if (socialImage) {
          tags.push(
            { tag: 'meta', attrs: { property: 'og:image', content: socialImage }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:image', content: socialImage }, injectTo: 'head' },
          )
        }

        // 구글 애널리틱스(방문자 통계) 설정: 외부 스크립트를 불러오는 태그 + 초기화 코드를 <head>에 넣는다.
        // JSON.stringify는 값을 따옴표로 감싼 안전한 문자열로 만들어 코드에 끼워 넣을 때 깨지지 않게 한다.
        if (googleAnalyticsId) {
          tags.push(
            {
              tag: 'script',
              attrs: {
                async: true,
                src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
              },
              injectTo: 'head',
            },
            {
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

        // 접근성: "본문으로 건너뛰기" 링크를 추가한다. 평소엔 화면 위쪽 밖(translateY(-150%))에 숨어 있다가,
        // 키보드 Tab으로 포커스가 오면(:focus) 화면에 나타난다. 스크린리더/키보드 사용자가 메뉴를 건너뛰고 본문(#root)으로 가게 해준다.
        // z-index 2147483647 = 정수 최댓값에 가까운 값으로, 항상 다른 요소 위에 보이게 한다.
        if (config.accessibility?.addBypassLinks) {
          tags.push(
            {
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
              tag: 'a',
              attrs: { class: 'figma-bypass-link', href: '#root' },
              children: 'Skip to content',
              injectTo: 'body-prepend',
            },
          )
        }

        // 교체가 끝난 HTML과 추가할 태그 목록을 Vite에 돌려주면, Vite가 최종 HTML에 태그를 삽입한다.
        return {
          html: result,
          tags,
        }
      },
    },
  }
}

/**
 * [쉬운 설명] 빌드 에러가 난 뒤에 새로 접속(새로고침)한 화면에도 에러 오버레이를 다시 보여주는 플러그인.
 * 비유: 방송을 놓친 사람에게 "다시보기"로 마지막 에러 소식을 한 번 더 틀어준다.
 * ws(WebSocket) = 서버가 브라우저에 실시간으로 메시지를 보내는 통로.
 *
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
function figmaErrorOverlayReplay(): Plugin {
  return {
    name: 'figma-error-overlay-replay',
    // 'serve' = 개발 서버에서만 동작(빌드에는 불필요)
    apply: 'serve',
    configureServer(server) {
      // 가장 최근에 보낸 에러 메시지를 기억해 두는 변수 (없으면 null)
      let lastError: object | null = null

      // 원래의 send 함수를 따로 보관(bind로 this를 고정)한 뒤, 같은 이름의 "감시 기능이 추가된" 함수로 바꿔치기한다.
      // 즉 메시지를 보낼 때마다 내용을 슬쩍 확인하고, 원래 하던 대로 전달한다(래핑).
      const origSend = server.ws.send.bind(server.ws) as (...args: any[]) => void
      server.ws.send = ((...args: any[]) => {
        const payload = args[0]
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const type = (payload as { type?: string }).type
          // 에러면 저장, 정상 갱신(update/full-reload)이면 지운다(고쳐진 뒤 낡은 에러가 남지 않게).
          if (type === 'error') {
            lastError = payload as object
          } else if (type === 'update' || type === 'full-reload') {
            lastError = null
          }
        }
        return origSend(...args)
      }) as typeof server.ws.send

      // 새 브라우저 연결이 생기면, 저장해 둔 에러가 있을 때 바로 다시 보내준다.
      server.ws.on('connection', (socket) => {
        if (lastError !== null) {
          socket.send(JSON.stringify(lastError))
        }
      })
    },
  }
}

/**
 * [쉬운 설명] 코드를 고치면 화면이 새로고침 없이 바로 바뀌는 기능(HMR, 핫 리로드)이 가끔 실패하는 경우를 보완한다.
 * 컴포넌트를 다른 파일로 옮기고 옛 파일을 "다시 내보내기"만 하는 파일로 바꾸면 화면이 안 바뀌는데,
 * 그때 페이지 전체를 강제로 새로고침해 준다. ("React Refresh 경계" = 화면 일부만 갈아끼울 수 있는 단위)
 *
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
function figmaReactRefreshBoundaryFallback(): Plugin {
  type ModuleNode = import('vite').ModuleNode
  // 파일별로 "이전에 새로고침 경계가 있었는가"를 기억하는 표. 예) { 'App.tsx': true }
  const hadRefreshBoundary = new Map<string, boolean>()
  // 경계가 있다가 사라진 파일들의 목록(문제 후보)
  const lostRefreshBoundaries = new Set<string>()
  // 전체 새로고침 신호를 보내는 함수. 서버가 시작되면 채워진다(그 전에는 null).
  let sendFullReload: (() => void) | null = null

  return {
    name: 'figma-react-refresh-boundary-fallback',
    apply: 'serve',
    // 'post' = 다른 플러그인들이 변환을 끝낸 뒤 마지막에 실행(변환된 결과 코드를 검사해야 해서)
    enforce: 'post',
    configureServer(server) {
      sendFullReload = () => server.ws.send({ type: 'full-reload', path: '*' })
    },
    // 파일이 수정되어 핫 업데이트가 일어날 때 호출된다.
    handleHotUpdate({ modules, server, timestamp }) {
      if (lostRefreshBoundaries.size === 0) return

      // 수정된 모듈을 시작점으로, 그 모듈을 import하는 상위 모듈들을 거슬러 올라가며 찾는다(너비/깊이 탐색).
      // visited = 이미 확인한 모듈(같은 곳을 두 번 도는 것을 방지), pending = 앞으로 확인할 모듈 대기열.
      const visited = new Set<ModuleNode>()
      const pending = [...modules]
      while (pending.length > 0) {
        const current = pending.pop()
        if (!current || visited.has(current)) continue
        visited.add(current)

        // id에 붙은 '?...' 부분(쿼리)을 떼고 순수 파일 경로만 쓴다.
        const moduleId = current.id?.split('?')[0]
        // 경계를 잃은 파일을 찾았다면: 캐시를 무효화하고 전체 새로고침을 보낸 뒤,
        // 빈 배열을 반환해 Vite의 기본 부분 갱신은 하지 않게 한다.
        if (moduleId && lostRefreshBoundaries.has(moduleId)) {
          const invalidated = new Set<ModuleNode>()
          for (const updatedModule of modules) {
            server.moduleGraph.invalidateModule(updatedModule, invalidated, timestamp, true)
          }
          sendFullReload?.()
          return []
        }

        pending.push(...current.importers)
      }
    },
    // 각 파일이 변환될 때마다 호출된다. 변환된 코드를 검사해 경계 유무를 기록하고, 코드 자체는 바꾸지 않는다(null 반환).
    transform(code, id) {
      // 정규식 /\.[jt]sx?(?:\?|$)/ : 확장자가 .js .jsx .ts .tsx 로 끝나는(뒤에 ?쿼리가 와도 됨) 파일만 대상.
      // 예) "App.tsx" 통과, "style.css" 제외. node_modules(외부 라이브러리)도 제외한다.
      if (!/\.[jt]sx?(?:\?|$)/.test(id) || id.includes('/node_modules/')) return null

      const moduleId = id.split('?')[0] ?? id
      // React Refresh 플러그인이 경계가 있는 파일에 넣는 함수 이름이 코드에 있는지로 판단한다.
      const hasRefreshBoundary = code.includes('registerExportsForReactRefresh')
      const previousHadRefreshBoundary = hadRefreshBoundary.get(moduleId)
      hadRefreshBoundary.set(moduleId, hasRefreshBoundary)

      // 경계가 다시 생겼으면 문제 목록에서 뺀다.
      if (hasRefreshBoundary) lostRefreshBoundaries.delete(moduleId)
      // 이전엔 있었는데 지금은 없다 = 경계를 잃었다 -> 목록에 추가하고 바로 전체 새로고침을 예약한다.
      // queueMicrotask = "현재 작업이 끝나자마자 곧바로 실행해 달라"고 예약하는 함수.
      if (previousHadRefreshBoundary && !hasRefreshBoundary) {
        lostRefreshBoundaries.add(moduleId)
        queueMicrotask(() => sendFullReload?.())
      }

      return null
    },
  }
}

/**
 * [쉬운 설명] Figma 미리보기 화면이 사용하는 "빈 도화지 페이지"(/.figma/make/kit.html)를 개발 서버에 만들어 준다.
 * 이 페이지가 src 안의 *.stories.* 파일(컴포넌트 예시 모음)을 전부 모아 window.__FIGMA__.stories 에 담아둔다.
 * 가상 모듈 = 디스크에 실제 파일은 없지만, 이름으로 import하면 코드를 즉석에서 만들어 주는 모듈.
 *
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
function figmaMakeKitPlugin(options: { storiesGlob: string | string[] }): Plugin {
  // 문자열 하나로 받든 배열로 받든 항상 배열로 통일한다. 예) 'a' -> ['a']
  const storiesGlob = Array.isArray(options.storiesGlob) ? options.storiesGlob : [options.storiesGlob]
  const ROUTE = '/.figma/make/kit.html'
  const VIRTUAL_ID = 'virtual:figma-stories'
  // 앞의 '\0'은 Vite 관례: "이 id는 가상 모듈이니 다른 플러그인은 건드리지 말라"는 표시.
  const RESOLVED_ID = '\0' + VIRTUAL_ID
  // 가상 모듈의 내용. import.meta.glob = 패턴에 맞는 파일들을 한꺼번에 불러올 수 있게 해주는 Vite 기능.
  // 예) '/src/**/*.stories.tsx' -> src 아래 모든 .stories.tsx 파일 목록
  const STORIES_MODULE = `export const stories = import.meta.glob(${JSON.stringify(storiesGlob)})`
  // 아래 템플릿 문자열은 서버가 내려줄 HTML 본문이다. 가상 모듈에서 stories를 가져와
  // window.__FIGMA__에 합친 뒤, 'figma.ready' 이벤트로 "준비 끝"을 Figma 쪽에 알린다.
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
    apply: 'serve',
    // 1) import 이름 해석: 'virtual:figma-stories'를 요청하면 내부 id로 바꿔 알려준다. 나머지는 모르는 척(null).
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      return null
    },
    // 2) 내용 제공: 위 내부 id를 요청하면 STORIES_MODULE 코드를 파일 내용 대신 돌려준다.
    load(id) {
      if (id !== RESOLVED_ID) return null
      return STORIES_MODULE
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        // kit.html 주소가 아니면 이 검문소는 통과시킨다.
        if (url.split('?')[0] !== ROUTE) return next()

        // transformIndexHtml을 거치면 Vite 개발용 스크립트(HMR 등)가 HTML에 자동으로 붙는다.
        // 오류가 나면 next(err)로 Vite의 기본 에러 처리에 넘긴다.
        try {
          res.setHeader('Content-Type', 'text/html')
          res.end(await server.transformIndexHtml(url, HTML_BOOTSTRAP))
        } catch (err) {
          next(err as Error)
        }
      })
    },
  }
}
