import { useId } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"
import { IconCheck } from "./IconCheck"

export type CheckboxState = "default" | "active"

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "children"> & {
  /** 체크박스의 접근성 이름이 되는 label 텍스트 */
  label: ReactNode
  /** 명시하지 않으면 checked로 추론한다. */
  state?: CheckboxState
  /** 있으면 아래에 표시한다. */
  errorMessage?: ReactNode
  className?: string
}

export function Checkbox({ label, state, checked, errorMessage, id, className, ...rest }: CheckboxProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const active = state ? state === "active" : Boolean(checked)

  return (
    <div className={["flex flex-col gap-4", className].filter(Boolean).join(" ")}>
      <label htmlFor={inputId} className="flex min-h-40 cursor-pointer items-center gap-8">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? errorId : undefined}
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden="true"
          className={[
            "inline-flex size-24 shrink-0 items-center justify-center rounded-4 border peer-focus-visible:border-border-focus",
            active
              ? "border-border-focus bg-fill-primary text-icon-on-dark"
              : errorMessage
                ? "border-border-error bg-bg-surface text-icon-disabled"
                : "border-border-default bg-bg-surface text-icon-disabled",
          ].join(" ")}
        >
          {active ? <IconCheck className="size-20" /> : null}
        </span>
        <span className="text-body-medium text-text-primary">{label}</span>
      </label>
      {errorMessage ? (
        <p id={errorId} role="alert" className="pl-32 text-caption-medium text-text-error">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
