import type { ReactNode } from "react"

export type ChipType = "benefit" | "package" | "sale"

export type ChipProps = {
  type?: ChipType
  label?: ReactNode
  children?: ReactNode
  className?: string
}

const LOOK: Record<ChipType, string> = {
  benefit: "h-20 bg-bg-accent-subtle text-caption-small-bold text-text-accent",
  package: "h-20 bg-bg-subtle text-caption-small-bold text-text-secondary",
  sale: "h-24 bg-fill-primary text-caption-bold text-text-on-dark",
}

/** 짧은 범주·상태 정보 (비인터랙티브) */
export function Chip({ type = "benefit", label, children, className }: ChipProps) {
  return (
    <span
      data-chip={type}
      className={["inline-flex w-fit items-center rounded-4 px-8 whitespace-nowrap", LOOK[type], className]
        .filter(Boolean)
        .join(" ")}
    >
      {label ?? children}
    </span>
  )
}
