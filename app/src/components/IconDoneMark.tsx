export type IconDoneMarkProps = {
  className?: string
}

/** icon/doneMark — 64×64 완료 표시. 의미는 옆의 텍스트로도 전달해야 한다. */
export function IconDoneMark({ className }: IconDoneMarkProps) {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={["size-[64px] shrink-0 text-icon-accent", className].filter(Boolean).join(" ")}
    >
      <circle cx="32" cy="32" r="32" />
      <path className="fill-icon-on-dark" d="M27.2 38.67 20.53 32l-2.27 2.26L27.2 43.2 46.4 24l-2.26-2.26z" />
    </svg>
  )
}
