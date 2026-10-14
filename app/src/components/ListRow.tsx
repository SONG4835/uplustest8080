import type { ReactNode } from "react"
import { IconCheck } from "./IconCheck"

export type ListRowType = "default" | "check"

export type ListRowProps = {
  type?: ListRowType
  label: ReactNode
  /** 금액(원)이면 화면에서 data-price span으로 감싸서 넘긴다. */
  value?: ReactNode
  className?: string
}

export function ListRow({ type = "default", label, value, className }: ListRowProps) {
  return (
    <div
      className={["flex min-h-[46px] w-full max-w-[358px] items-center justify-between gap-12 py-12", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="flex min-w-0 items-center gap-8 text-body-medium text-text-secondary">
        {type === "check" ? <IconCheck className="text-icon-accent" /> : null}
        <span>{label}</span>
      </span>
      {value !== undefined && value !== null ? (
        <span className="text-right text-body-strong text-text-primary">{value}</span>
      ) : null}
    </div>
  )
}
