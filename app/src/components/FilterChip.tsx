import type { ButtonHTMLAttributes, ReactNode } from "react"
import { IconCheck } from "./IconCheck"

export type FilterChipState = "default" | "selected"

export type FilterChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> & {
  /** 칩 이름 (접근성 이름이 된다). label 대신 children도 받는다. */
  label?: ReactNode
  children?: ReactNode
  /** 명시하지 않으면 selected prop으로 추론한다. */
  state?: FilterChipState
  selected?: boolean
}

export function FilterChip({ label, children, state, selected, className, ...rest }: FilterChipProps) {
  const on = state ? state === "selected" : Boolean(selected)
  return (
    <button
      type="button"
      aria-pressed={on}
      className={[
        "inline-flex h-40 w-fit shrink-0 items-center gap-4 rounded-full border px-16 whitespace-nowrap",
        on
          ? "border-border-strong bg-fill-secondary text-body-small-strong text-text-on-dark"
          : "border-border-default bg-bg-surface text-body-small-medium text-text-secondary hover:bg-bg-subtle",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {on ? <IconCheck className="size-16" /> : null}
      <span>{label ?? children}</span>
    </button>
  )
}
