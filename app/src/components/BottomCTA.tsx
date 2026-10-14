import type { ReactNode } from "react"

export type BottomCTALayout = "single" | "double" | "price"

export type BottomCTAProps = {
  layout?: BottomCTALayout
  /** price 레이아웃의 요약 라벨 */
  amountLabel?: ReactNode
  /** price 레이아웃의 금액. data-price="monthly" span으로 감싼다. */
  amount?: ReactNode
  /** single: Button 1개, double: 보조+핵심 Button 2개, price: 핵심 Button 1개 */
  children: ReactNode
  className?: string
}

export function BottomCTA({ layout = "single", amountLabel, amount, children, className }: BottomCTAProps) {
  const isPrice = layout === "price"
  return (
    <div
      data-bottom-cta=""
      className={[
        "fixed right-0 bottom-0 left-0 mx-auto flex w-full max-w-[390px] flex-col gap-16 border-t border-border-subtle bg-bg-surface px-16 pt-12 pb-32",
        isPrice ? "h-[139px]" : "h-[97px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isPrice ? (
        <div className="flex items-center justify-between gap-8">
          <span className="text-body-small-medium text-text-secondary">{amountLabel}</span>
          {amount !== undefined && amount !== null ? (
            <span data-price="monthly" className="text-subtitle-bold text-text-primary">
              {amount}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className={["grid gap-8", layout === "double" ? "grid-cols-2" : "grid-cols-1"].join(" ")}>{children}</div>
    </div>
  )
}
