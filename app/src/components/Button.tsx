import type { ButtonHTMLAttributes, ReactNode } from "react"

export type ButtonVariant = "Primary" | "Secondary"
export type ButtonSize = "sm" | "lg" | "xl"
export type ButtonState = "Default" | "Hover" | "Disabled"

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** Design.md `Type` */
  variant?: ButtonVariant
  size?: ButtonSize
  /** Design.md `State`. `Disabled`이거나 disabled prop이 true면 disabled 속성을 단다. */
  state?: ButtonState
  fullWidth?: boolean
  children: ReactNode
}

const SIZE: Record<ButtonSize, string> = {
  sm: "h-40 px-16 text-body-small-strong",
  lg: "h-48 px-20 text-body-strong",
  xl: "h-[52px] px-20 text-subtitle-default",
}

const LOOK: Record<ButtonVariant, { base: string; hover: string; disabled: string }> = {
  Primary: {
    base: "bg-fill-primary text-text-on-dark hover:bg-fill-primary-hover",
    hover: "bg-fill-primary-hover text-text-on-dark",
    disabled: "bg-fill-disabled text-text-on-disabled",
  },
  Secondary: {
    base: "border border-border-default bg-bg-surface text-text-primary hover:bg-bg-subtle",
    hover: "border border-border-strong bg-bg-subtle text-text-primary",
    disabled: "border border-border-subtle bg-fill-tertiary text-text-on-disabled",
  },
}

export function Button({
  variant = "Primary",
  size = "lg",
  state = "Default",
  disabled,
  fullWidth,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled) || state === "Disabled"
  const look = LOOK[variant]
  const tone = isDisabled ? look.disabled : state === "Hover" ? look.hover : look.base
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      className={[
        "inline-flex items-center justify-center gap-4 rounded-12 whitespace-nowrap disabled:cursor-not-allowed",
        SIZE[size],
        tone,
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  )
}
