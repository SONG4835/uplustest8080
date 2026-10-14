import type { ReactNode } from "react"

export type StepProgressStep = 1 | 2 | 3

export type StepProgressProps = {
  /** 현재 단계. 실제 진행 단계와 항상 같게 둔다. */
  step: StepProgressStep
  /** 각 단계 이름 (3개). 없으면 단계 번호만 표시한다. */
  labels?: [ReactNode, ReactNode, ReactNode]
  className?: string
}

const STEPS: StepProgressStep[] = [1, 2, 3]

export function StepProgress({ step, labels, className }: StepProgressProps) {
  return (
    <ol
      aria-label={`진행 단계 ${step}/3`}
      className={["flex h-[30px] w-full max-w-[358px] gap-4", className].filter(Boolean).join(" ")}
    >
      {STEPS.map((n) => {
        const current = n === step
        const done = n < step
        return (
          <li key={n} aria-current={current ? "step" : undefined} className="flex flex-1 flex-col gap-8">
            <span
              aria-hidden="true"
              className={["h-4 w-full rounded-full", current || done ? "bg-fill-primary" : "bg-fill-tertiary"].join(" ")}
            />
            <span
              className={
                current
                  ? "text-caption-bold text-text-accent"
                  : done
                    ? "text-caption-medium text-text-secondary"
                    : "text-caption-medium text-text-tertiary"
              }
            >
              {labels ? labels[n - 1] : `${n}단계`}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
