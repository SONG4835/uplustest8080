import type { MouseEventHandler } from "react"

export type IconArrowLeftProps = {
  /** 있으면 40×40 터치 영역의 뒤로 버튼으로 렌더한다 (aria-label="뒤로"). */
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
}

function ArrowSvg({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={["size-24 shrink-0", className].filter(Boolean).join(" ")}
    >
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  )
}

/** icon/arrowLeft — 24×24. onClick이 있으면 뒤로 버튼(최소 40×40)으로 감싼다. */
export function IconArrowLeft({ onClick, className }: IconArrowLeftProps) {
  if (!onClick) return <ArrowSvg className={["text-icon-strong", className].filter(Boolean).join(" ")} />
  return (
    <button
      type="button"
      aria-label="뒤로"
      onClick={onClick}
      className={[
        "inline-flex size-40 items-center justify-center rounded-full text-icon-strong hover:bg-bg-subtle",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ArrowSvg />
    </button>
  )
}
