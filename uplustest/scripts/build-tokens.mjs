// src/tokens/tokens.json(Figma 변수 원본)에서 src/tokens/tokens.css와 src/tokens/tokens.ts를 생성한다.
// 사용법: node scripts/build-tokens.mjs
// Figma 변수가 바뀌면 src/tokens/tokens.json만 갱신하고 이 스크립트를 다시 실행한다. 생성된 파일은 직접 수정하지 않는다.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'src', 'tokens', 'tokens.json')
const outDir = path.join(root, 'src', 'tokens')
const tokens = JSON.parse(readFileSync(source, 'utf8'))

const HEADER = '자동 생성 파일입니다. 직접 수정하지 말고 src/tokens/tokens.json 수정 후 `node scripts/build-tokens.mjs`를 실행하세요.'

// Figma 이름 "gray/900" → CSS 이름 "gray-900"
const slug = (name) => name.replace(/\//g, '-')
// "font-size/heading-h1" → "heading-h1" (컬렉션 접두사 제거)
const strip = (name, prefix) => name.replace(new RegExp(`^${prefix}/`), '')
const px = (n) => (n === 0 ? '0' : `${n}px`)

const fontFamily = tokens.typography['font-family/family-font']
const fontSizes = Object.entries(tokens.typography).filter(([k]) => k.startsWith('font-size/'))

// --- tokens.css -------------------------------------------------------------
const css = []
css.push(`/* ${HEADER} */`, '')
css.push('@theme {')
css.push('  /* Tailwind 기본값을 지우고 Figma 토큰만 남긴다 */')
css.push('  --color-*: initial;', '  --text-*: initial;', '  --radius-*: initial;', '')
css.push('  /* 1 단위 = 1px. p-16 = 16px처럼 Figma의 px 값과 클래스 숫자가 일치한다 */')
css.push('  --spacing: 1px;', '')

css.push('  /* primitive */')
for (const [name, value] of Object.entries(tokens.primitive)) {
  css.push(`  --color-${slug(name)}: ${value};`)
}
css.push('', '  /* semantic → primitive 참조 */')
for (const [name, { primitive }] of Object.entries(tokens.semantic)) {
  css.push(`  --color-${slug(name)}: var(--color-${slug(primitive)});`)
}

css.push('', '  /* typography */')
css.push(`  --font-family-font: "${fontFamily}", sans-serif;`)
css.push('  --font-sans: var(--font-family-font);')
for (const [name, value] of fontSizes) {
  css.push(`  --text-${strip(name, 'font-size')}: ${px(value)};`)
}

css.push('', '  /* spacing */')
for (const [name, value] of Object.entries(tokens.spacing).sort((a, b) => a[1] - b[1])) {
  css.push(`  --spacing-${strip(name, 'spacing')}: ${px(value)};`)
}

css.push('', '  /* radius */')
for (const [name, value] of Object.entries(tokens.radius)) {
  css.push(`  --radius-${strip(name, 'radius')}: ${px(value)};`)
}
css.push('}', '')

css.push('/* 텍스트 스타일: Figma "heading/h1" → 클래스 "typo-heading-h1" */')
for (const [name, s] of Object.entries(tokens.textStyles)) {
  const size = typeof s.fontSize === 'number' ? px(s.fontSize) : `var(--text-${strip(s.fontSize, 'font-size')})`
  css.push(`@utility typo-${slug(name)} {`)
  css.push('  font-family: var(--font-family-font);')
  css.push(`  font-size: ${size};`)
  css.push(`  font-weight: ${s.fontWeight};`)
  css.push(`  line-height: ${px(s.lineHeight)};`)
  css.push(`  letter-spacing: ${px(s.letterSpacing)};`)
  css.push('}')
}

// --- tokens.ts --------------------------------------------------------------
const color = {
  ...tokens.primitive,
  ...Object.fromEntries(Object.entries(tokens.semantic).map(([k, v]) => [k, v.value])),
}
const textStyle = Object.fromEntries(
  Object.entries(tokens.textStyles).map(([k, s]) => [
    k,
    {
      fontFamily,
      fontSize: typeof s.fontSize === 'number' ? s.fontSize : tokens.typography[s.fontSize],
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
    },
  ]),
)
const ts = `// ${HEADER}
// 키는 Figma 변수·스타일 이름 그대로이고, 값은 참조를 풀어낸 최종값이다(px 단위 숫자).

export const color = ${JSON.stringify(color, null, 2)} as const

export const fontSize = ${JSON.stringify(Object.fromEntries(fontSizes), null, 2)} as const

export const spacing = ${JSON.stringify(tokens.spacing, null, 2)} as const

export const radius = ${JSON.stringify(tokens.radius, null, 2)} as const

export const textStyle = ${JSON.stringify(textStyle, null, 2)} as const

export type ColorToken = keyof typeof color
export type SpacingToken = keyof typeof spacing
export type RadiusToken = keyof typeof radius
export type TextStyleToken = keyof typeof textStyle

const tokens = { color, fontSize, spacing, radius, textStyle }
export default tokens
`

mkdirSync(outDir, { recursive: true })
writeFileSync(path.join(outDir, 'tokens.css'), css.join('\n') + '\n')
writeFileSync(path.join(outDir, 'tokens.ts'), ts)
console.log(
  `src/tokens 생성 완료: color ${Object.keys(color).length}, fontSize ${fontSizes.length}, ` +
    `spacing ${Object.keys(tokens.spacing).length}, radius ${Object.keys(tokens.radius).length}, ` +
    `textStyle ${Object.keys(textStyle).length}`,
)
