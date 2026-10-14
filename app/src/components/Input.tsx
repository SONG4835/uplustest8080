import { useId } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"

export type InputState = "default" | "focus" | "filled" | "caution" | "disabled"

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "children"> & {
  /** <label> 텍스트 */
  label: ReactNode
  /** 있으면 입력란 아래에 노출하고 caution 상태가 된다. */
  errorMessage?: ReactNode
  /** 명시하지 않으면 disabled → errorMessage → value 순으로 추론한다. focus는 CSS로 표현. */
  state?: InputState
  className?: string
}

const BOX: Record<InputState, string> = {
  default: "border-border-default bg-bg-surface focus-within:border-border-focus",
  focus: "border-border-focus bg-bg-surface",
  filled: "border-border-default bg-bg-surface focus-within:border-border-focus",
  caution: "border-border-error bg-bg-surface",
  disabled: "border-border-subtle bg-bg-subtle",
}

export function Input({ label, errorMessage, state, id, value, disabled, className, ...rest }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const hasValue = value !== undefined && value !== null && String(value) !== ""
  const s: InputState =
    state ?? (disabled ? "disabled" : errorMessage ? "caution" : hasValue ? "filled" : "default")
  const showError = s === "caution" && Boolean(errorMessage)

  return (
    <div className={["flex w-full max-w-[358px] flex-col", className].filter(Boolean).join(" ")}>
      <div
        className={[
          "flex h-58 flex-col justify-center gap-4 rounded-12 border px-16",
          BOX[s],
        ].join(" ")}
      >
        <label
          htmlFor={inputId}
          className={[
            "text-caption-medium",
            s === "caution" ? "text-text-error" : s === "disabled" ? "text-text-on-disabled" : "text-text-secondary",
          ].join(" ")}
        >
          {label}
        </label>
        <input
          id={inputId}
          value={value}
          disabled={s === "disabled" || disabled}
          aria-invalid={s === "caution" || undefined}
          aria-describedby={showError ? errorId : undefined}
          className="w-full bg-transparent text-body-medium text-text-primary outline-none placeholder:text-text-placeholder disabled:text-text-on-disabled"
          {...rest}
        />
      </div>
      {showError && (
        <p id={errorId} role="alert" className="flex items-center gap-4 pt-8 text-caption-medium text-text-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-16 shrink-0 text-icon-error">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  )
}
