import type { MouseEventHandler, ReactNode } from "react"
import { IconArrowLeft } from "./IconArrowLeft"
import { Logo } from "./Logo"

export type HeaderType = "default" | "root"

export type HeaderProps = {
  /** default: 뒤로 버튼 + 제목, root: 제목 + 로고 */
  type?: HeaderType
  title: ReactNode
  /** default 타입의 뒤로 버튼 동작 (aria-label="뒤로") */
  onBack?: MouseEventHandler<HTMLButtonElement>
  /** 선행 슬롯 대체: default면 뒤로 버튼 자리, root면 로고 자리 */
  children?: ReactNode
  className?: string
}

export function Header({ type = "default", title, onBack, children, className }: HeaderProps) {
  const root = type === "root"
  return (
    <header
      className={[
        "sticky top-0 flex h-[56px] w-full max-w-[390px] items-center gap-8 bg-bg-surface px-16",
        root ? "justify-between" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {root ? (
        <>
          <span className="text-heading-h4 text-text-primary">{title}</span>
          {children ?? <Logo />}
        </>
      ) : (
        <>
          {children ?? <IconArrowLeft onClick={onBack ?? (() => window.history.back())} />}
          <span className="min-w-0 flex-1 truncate text-center text-subtitle-default text-text-primary">{title}</span>
          <span aria-hidden="true" className="size-40 shrink-0" />
        </>
      )}
    </header>
  )
}
