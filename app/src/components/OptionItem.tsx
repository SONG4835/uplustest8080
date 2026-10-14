import type { ButtonHTMLAttributes, ReactNode } from "react"
import { IconCheck } from "./IconCheck"

export type OptionItemState = "default" | "selected"

export type OptionItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title" | "children"> & {
  title: ReactNode
  desc?: ReactNode
  state?: OptionItemState
}

/** 설명이 있는 단일 선택 항목. 부모에 role="radiogroup"을 둔다. */
export function OptionItem({ title, desc, state = "default", className, type = "button", ...rest }: OptionItemProps) {
  const selected = state === "selected"
  return (
    <button
      type={type}
      role="radio"
      aria-checked={selected}
      className={[
        "flex w-full max-w-[358px] items-center gap-12 rounded-16 border p-20 text-left",
        selected
          ? "min-h-[86px] border-border-focus bg-bg-accent-subtle"
          : "min-h-[83px] border-border-default bg-bg-surface hover:bg-bg-subtle",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-4">
        <span className={selected ? "text-body-strong text-text-primary" : "text-body-medium text-text-primary"}>{title}</span>
        {desc ? <span className="text-body-small-medium text-text-secondary">{desc}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className={[
          "inline-flex size-24 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-border-focus bg-fill-primary text-icon-on-dark" : "border-border-default bg-bg-surface",
        ].join(" ")}
      >
        {selected ? <IconCheck className="size-20" /> : null}
      </span>
    </button>
  )
}
