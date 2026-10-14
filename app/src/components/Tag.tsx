import type { ReactNode } from "react"

export type TagProps = {
  label?: ReactNode
  children?: ReactNode
  /** DOM 표식 data-tag 값 (시각 Variant 아님). 추천이면 "recommended". */
  variant?: "recommended"
  className?: string
}

/** 짧은 분류·강조 레이블 (비인터랙티브). 기본 47×26, 좌우 padding 12. */
export function Tag({ label, children, variant, className }: TagProps) {
  return (
    <span
      data-tag={variant}
      className={[
        "inline-flex h-[26px] w-fit min-w-[47px] items-center justify-center rounded-full bg-bg-accent-subtle px-12 text-caption-bold whitespace-nowrap text-text-accent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label ?? children}
    </span>
  )
}
