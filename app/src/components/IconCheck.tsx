import type { SVGProps } from "react"

export type IconCheckProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  className?: string
}

/** icon/check — 24×24. 색은 부모/className의 text-icon-* 토큰(currentColor)에서 받는다. */
export function IconCheck({ className, ...rest }: IconCheckProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={[/\bsize-/.test(className ?? "") ? "" : "size-24", "shrink-0", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  )
}
