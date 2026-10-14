// ============================================================
// App.tsx : 요금제 조회 → 상세 → 신청 → 완료 흐름을 보여주는 앱
// (React로 만든 모바일 웹 화면 4개를 한 파일에서 관리합니다)
// ============================================================

// React에서 제공하는 도구(훅)들을 가져옵니다.
// - useState : 화면에서 바뀌는 값(상태)을 기억할 때 사용
// - useEffect : 화면이 처음 나타날 때 등 "부수 작업"을 할 때 사용
// - useMemo : 계산 결과를 기억해 두었다가 불필요한 재계산을 막을 때 사용
// - FormEvent, ReactNode : TypeScript용 타입(자료의 모양)만 가져옵니다
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"

// ------------------------------------------------------------
// 1. 타입 정의 (데이터가 어떤 모양인지 미리 약속해 두는 부분)
// ------------------------------------------------------------

// Route = "지금 어느 화면인가"를 나타내는 타입.
// 아래 4가지 중 하나만 될 수 있습니다.
//  - plans    : 요금제 목록 화면
//  - detail   : 요금제 상세 화면 (어떤 요금제인지 planId 필요)
//  - apply    : 신청서 입력 화면 (planId 필요)
//  - complete : 신청 완료 화면
type Route = { name: "plans" } | { name: "detail" planId: string } | {
  name: "apply"
  planId: string
} | { name: "complete" }

// Plan = 요금제 하나의 정보
type Plan = {
  id: string // 요금제를 구분하는 고유 값
  name: string // 요금제 이름
  price: number // 월 요금(할인 적용 후)
  originalPrice?: number // 할인 전 가격 (물음표 = 없을 수도 있음)
  discount?: string // 할인율 표시 문구 (예: "15%")
  data: string // 제공 데이터량
  description: string // 한 줄 설명
  badge?: string // "추천" 같은 뱃지 문구
  promo?: string // 프로모션 안내 문구
  // 이 요금제가 속한 분류. 필터 버튼과 연결됩니다.
  categories: Array<"데이터 많이" | "가성비" | "구독 포함" | "통화 많이">
  benefits: string[] // 포함 혜택 목록
}

// Application = 사용자가 제출한 신청 내역
type Application = {
  number: string // 신청 번호
  plan: Plan // 신청한 요금제
  name: string // 신청자 이름
  phone: string // 신청자 휴대폰 번호
  appliedAt: string // 신청 일시
}

// ------------------------------------------------------------
// 2. 고정 데이터 (서버 없이 코드 안에 직접 적어 둔 요금제 목록)
// ------------------------------------------------------------
const plans: Plan[] = [
  {
    id: "unlimited",
    name: "넉넉 무제한",
    price: 85000,
    originalPrice: 100000,
    discount: "15%",
    data: "무제한",
    description: "영상·게임을 하루 종일 해도 걱정 없어요",
    badge: "추천",
    promo: "24개월 할인 프로모션",
    categories: ["데이터 많이", "구독 포함", "통화 많이"],
    benefits: ["넷플릭스 스탠다드", "유튜브 프리미엄"],
  },
  {
    id: "standard",
    name: "스탠다드 110",
    price: 69000,
    originalPrice: 78000,
    discount: "12%",
    data: "110GB",
    description: "데이터 110GB · 통화 무제한",
    badge: "추천",
    promo: "24개월 할인 프로모션",
    categories: ["데이터 많이", "가성비", "통화 많이"],
    benefits: ["데이터 소진 후 5Mbps", "테더링 40GB"],
  },
  {
    id: "light",
    name: "라이트 30",
    price: 49000,
    data: "30GB",
    description: "데이터 30GB · 통화 무제한",
    badge: "추천",
    categories: ["데이터 많이", "가성비", "통화 많이"],
    benefits: ["데이터 소진 후 1Mbps", "테더링 10GB"],
  },
  {
    id: "slim",
    name: "슬림 10",
    price: 39000,
    originalPrice: 43000,
    discount: "10%",
    data: "10GB",
    description: "데이터 10GB · 통화 무제한",
    badge: "추천",
    categories: ["데이터 많이", "가성비", "통화 많이"],
    benefits: ["데이터 소진 후 1Mbps", "U+zone 무료"],
  },
]

// 화면 위쪽에 보여줄 필터 버튼 이름들. (as const = 값이 바뀌지 않는 고정 목록)
const filters = ["데이터 많이", "가성비", "구독 포함", "통화 많이"] as const

// ------------------------------------------------------------
// 3. 도우미 함수들
// ------------------------------------------------------------

// 숫자를 "85,000원" 처럼 천 단위 쉼표와 "원"을 붙인 글자로 바꿉니다.
function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`
}

// 브라우저 주소창(URL)을 읽어서 "지금 어느 화면인지"(Route)로 바꿔 줍니다.
function readRoute(): Route {
  const path = window.location.pathname // 예: "/plans/light"
  // 정규식으로 "/plans/아이디" 모양인지 확인 (아이디 부분을 match[1]로 꺼냄)
  const match = path.match(/^\/plans\/([^/]+)$/)

  if (match) return { name: "detail", planId: match[1] }
  if (path === "/apply") {
    return {
      name: "apply",
      // 주소 뒤의 ?plan=xxx 값을 읽고, 없으면(??) 첫 번째 요금제를 기본값으로 사용
      planId:
        new URLSearchParams(window.location.search).get("plan") ?? plans[0].id,
    }
  }
  if (path === "/complete") return { name: "complete" }
  // 위 어디에도 해당하지 않으면 목록 화면
  return { name: "plans" }
}

// readRoute의 반대 동작: 화면(Route)을 주소창에 보여줄 URL 글자로 바꿉니다.
function pathFor(route: Route) {
  if (route.name === "plans") return "/plans"
  if (route.name === "detail") return `/plans/${route.planId}`
  if (route.name === "apply") return `/apply?plan=${route.planId}`
  return "/complete"
}

// ------------------------------------------------------------
// 4. 작은 공통 부품(컴포넌트)들
//    컴포넌트 = 화면의 한 조각을 만드는 함수. 여러 곳에서 재사용합니다.
// ------------------------------------------------------------

// 화면 맨 위 헤더.
// - title : 가운데(또는 왼쪽)에 표시할 제목
// - root  : 첫 화면용 헤더인지 여부 (true면 뒤로가기 버튼 대신 로고 표시)
// - onBack: 뒤로가기 버튼을 눌렀을 때 실행할 함수
function Header({
  title,
  root = false,
  onBack,
}: {
  title: string
  root?: boolean
  onBack?: () => void
}) {
  return (
    <header className={`app-header${root ? " app-header--root" : ""}`}>
      {/* 왼쪽: 첫 화면이면 제목, 아니면 뒤로가기 버튼 */}
      {root ? (
        <span className="header-title">{title}</span>
      ) : (
        <button
          className="icon-button"
          type="button"
          aria-label="이전 화면"
          onClick={onBack}
        >
          <img src="/assets/f152b.svg" alt="" />
        </button>
      )}
      {/* 오른쪽: 첫 화면이면 로고, 아니면 제목 + 균형을 맞추는 빈 공간 */}
      {root ? (
        <img className="logo" src="/assets/38036.svg" alt="U+" />
      ) : (
        <>
          <span className="header-title">{title}</span>
          <span className="header-spacer" aria-hidden="true" />
        </>
      )}
    </header>
  )
}

// 공통 버튼.
// - variant : "primary"(주요, 강조) / "secondary"(보조) 두 가지 모양
// - disabled: true면 눌러도 동작하지 않는 비활성 버튼
// - children: 버튼 안에 들어갈 글자
function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  type?: "button" | "submit"
  variant?: "primary" | "secondary"
  disabled?: boolean
}) {
  return (
    <button
      className={`kit-button kit-button--${variant}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// 필터 버튼(칩) 하나. selected가 true면 "선택된" 모양으로 표시됩니다.
function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`filter-chip${selected ? " filter-chip--selected" : ""}`}
      type="button"
      aria-pressed={selected} // 스크린리더에 "눌린 상태"를 알려 주는 접근성 속성
      onClick={onClick}
    >
      {label}
    </button>
  )
}

// "추천" 같은 작은 라벨(태그)
function Tag({ children }: { children: ReactNode }) {
  return <span className="tag w-fit self-start">{children}</span>
}

// 목록의 한 줄 (왼쪽 이름 + 오른쪽 값).
// check가 true면 앞에 체크 아이콘이 붙는 "혜택 목록" 모양이 됩니다.
function ListRow({
  label,
  value,
  check = false,
}: {
  label: string
  value?: string
  check?: boolean
}) {
  return (
    <div className={`list-row${check ? " list-row--check" : ""}`}>
      {/* check일 때만 체크 아이콘 표시 (A && B : A가 참일 때만 B를 그림) */}
      {check && (
        <img className="benefit-bullet" src="/assets/d5cc2.svg" alt="" />
      )}
      <span className={check ? "list-row-value" : "list-row-label"}>
        {label}
      </span>
      {/* value가 있을 때만 오른쪽 값을 표시 */}
      {value && <span className="list-row-value">{value}</span>}
    </div>
  )
}

// 화면 아래에 고정된 버튼 영역.
// summary를 주면 버튼 왼쪽에 "월 납부 금액 ○○원" 같은 요약이 함께 나옵니다.
function BottomCta({
  children,
  summary,
}: {
  children: ReactNode
  summary?: { label: string amount: string }
}) {
  return (
    <div className={`bottom-cta${summary ? " bottom-cta--price" : ""}`}>
      {summary && (
        <div className="cta-summary">
          <span>{summary.label}</span>
          <strong>{summary.amount}</strong>
        </div>
      )}
      <div className="cta-actions">{children}</div>
    </div>
  )
}

// 요금제 목록에 나오는 카드 하나. "자세히"를 누르면 onDetail이 실행됩니다.
function PlanCard({ plan, onDetail }: { plan: Plan onDetail: () => void }) {
  return (
    <article className="plan-card">
      {/* 뱃지가 있는 요금제만 태그 표시 */}
      {plan.badge && <Tag>{plan.badge}</Tag>}
      <span className="plan-name">{plan.name}</span>
      <span className="plan-description">{plan.description}</span>
      <div className="plan-price-row">
        <div className="plan-price-group">
          <div className="current-price">
            {/* 할인이 있을 때만 할인율 표시 */}
            {plan.discount && (
              <strong className="discount">{plan.discount}</strong>
            )}
            <strong>월 {formatPrice(plan.price)}</strong>
          </div>
          {/* 할인 전 가격이 있을 때만 표시 */}
          {plan.originalPrice && (
            <span className="original-price">
              월 {formatPrice(plan.originalPrice)}
            </span>
          )}
          {plan.promo && <span className="promo-chip">{plan.promo}</span>}
        </div>
        <Button variant="secondary" onClick={onDetail}>
          자세히
        </Button>
      </div>
    </article>
  )
}

// ------------------------------------------------------------
// 5. 화면(Screen) 컴포넌트 4개
// ------------------------------------------------------------

// [화면 1] 요금제 목록 화면
// navigate: 다른 화면으로 이동시키는 함수 (App에서 전달받음)
function PlansScreen({ navigate }: { navigate: (route: Route) => void }) {
  // filter = 현재 선택된 필터. setFilter로 바꾸면 화면이 다시 그려집니다.
  const [filter, setFilter] = useState<typeof filters[number]>("데이터 많이")
  // 선택된 필터에 해당하는 요금제만 골라냅니다.
  // useMemo: filter가 바뀔 때만 다시 계산하고, 아니면 이전 결과를 재사용합니다.
  const visiblePlans = useMemo(
    () => plans.filter((plan) => plan.categories.includes(filter)),
    [filter],
  )

  return (
    <main className="screen screen--muted">
      <Header title="요금제" root />
      <div className="scroll-content plans-content">
        <section className="title-group">
          <h1>
            나에게 맞는 요금제를
            <br />
            골라보세요
          </h1>
          <p>중요하게 보는 조건을 고르면 추천해 드려요</p>
        </section>
        {/* 필터 버튼들: 목록을 돌면서(map) 버튼을 하나씩 만듭니다 */}
        <div className="filter-list" aria-label="요금제 필터">
          {filters.map((item) => (
            <FilterChip
              key={item} // React가 항목을 구분하기 위한 고유 이름표
              label={item}
              selected={filter === item}
              onClick={() => setFilter(item)}
            />
          ))}
        </div>
        {/* 필터에 맞는 요금제 카드 목록 */}
        <section className="plan-list">
          <p className="list-meta">추천순 · {visiblePlans.length}개</p>
          {visiblePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              // "자세히"를 누르면 상세 화면으로 이동
              onDetail={() => navigate({ name: "detail", planId: plan.id })}
            />
          ))}
        </section>
      </div>
    </main>
  )
}

// [화면 2] 요금제 상세 화면. 선택된 요금제(plan)의 자세한 정보를 보여줍니다.
function DetailScreen({
  plan,
  navigate,
}: {
  plan: Plan
  navigate: (route: Route) => void
}) {
  return (
    <main className="screen">
      {/* 뒤로가기를 누르면 목록 화면으로 */}
      <Header title="요금제 상세" onBack={() => navigate({ name: "plans" })} />
      <div className="scroll-content screen-with-price-cta">
        <section className="detail-title">
          {plan.badge && <Tag>{plan.badge}</Tag>}
          <h1>{plan.name}</h1>
          <p>{plan.description}</p>
        </section>
        {/* 가격 카드: 현재 가격, 할인율, 할인 전 가격(취소선) */}
        <section className="price-card">
          <span>월 요금</span>
          <div className="price-card-current">
            <strong>{formatPrice(plan.price)}</strong>
            {plan.discount && <b>{plan.discount}</b>}
          </div>
          {plan.originalPrice && (
            <small>
              <s>{formatPrice(plan.originalPrice)}/월</s> · 24개월 할인 프로모션
              적용
            </small>
          )}
        </section>
        <section className="detail-section">
          <h2>기본 제공</h2>
          <ListRow label="데이터" value={plan.data} />
          <ListRow label="통화" value="집·이동전화 무제한" />
          <ListRow label="문자" value="기본 제공" />
        </section>
        <section className="detail-section">
          <h2>포함 혜택</h2>
          {/* 혜택 목록을 한 줄씩 체크 표시와 함께 출력 */}
          {plan.benefits.map((benefit) => (
            <ListRow key={benefit} label={benefit} value="포함" check />
          ))}
        </section>
      </div>
      {/* 하단 고정 영역: 월 납부 금액 + 신청 버튼 */}
      <BottomCta
        summary={{ label: "월 납부 금액", amount: formatPrice(plan.price) }}
      >
        <Button onClick={() => navigate({ name: "apply", planId: plan.id })}>
          구독 신청하기
        </Button>
      </BottomCta>
    </main>
  )
}

// [화면 3] 신청서 입력 화면.
// onComplete: 신청이 끝났을 때 신청 내역을 부모(App)에게 넘겨주는 함수
function ApplyScreen({
  plan,
  navigate,
  onComplete,
}: {
  plan: Plan
  navigate: (route: Route) => void
  onComplete: (application: Application) => void
}) {
  // 입력창에 적힌 값들을 상태로 기억합니다.
  const [name, setName] = useState("") // 이름
  const [phone, setPhone] = useState("") // 휴대폰 번호
  const [agreed, setAgreed] = useState(false) // 개인정보 동의 체크 여부
  // 입력이 올바른지 검사: 이름 2글자 이상 + 숫자 10자리 이상 + 동의 체크
  // (replace(/\D/g, "") = 숫자가 아닌 글자를 모두 지움)
  const valid =
    name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10 && agreed

  // 전화번호 입력 시 자동으로 "010-1234-5678" 모양으로 하이픈을 넣어 줍니다.
  function handlePhone(value: string) {
    // 숫자만 남기고 최대 11자리까지만 사용
    const digits = value.replace(/\D/g, "").slice(0, 11)
    const formatted =
      digits.length < 4
        ? digits // 3자리 이하: 그대로
        : digits.length < 8
          ? `${digits.slice(0, 3)}-${digits.slice(3)}` // 4~7자리: 010-1234
          : `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}` // 8자리 이상: 010-1234-5678
    setPhone(formatted)
  }

  // "신청하기" 버튼을 눌러 폼을 제출할 때 실행됩니다.
  function submit(event: FormEvent) {
    event.preventDefault() // 브라우저의 기본 동작(페이지 새로고침)을 막음
    if (!valid) return // 입력이 올바르지 않으면 아무것도 하지 않음
    const now = new Date() // 현재 시각
    onComplete({
      // 신청 번호: "UP" + 년월일 + "-01" (예: UP20250616-01)
      // padStart(2, "0") = 한 자리 숫자 앞에 0을 붙여 두 자리로 만듦 (6 → 06)
      number: `UP${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-01`,
      plan,
      name: name.trim(), // 앞뒤 공백 제거
      phone,
      // 신청 일시를 한국식 날짜/시간 글자로 만듦
      appliedAt: new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // 24시간제
      }).format(now),
    })
  }

  return (
    <main className="screen">
      {/* 뒤로가기를 누르면 방금 보던 요금제 상세 화면으로 */}
      <Header
        title="구독 신청"
        onBack={() => navigate({ name: "detail", planId: plan.id })}
      />
      <form className="application-form" onSubmit={submit}>
        <div className="scroll-content screen-with-cta">
          <section className="title-group title-only">
            <h1>
              신청 정보를
              <br />
              입력해주세요
            </h1>
          </section>
          {/* 선택한 요금제 요약 */}
          <section className="apply-summary">
            <ListRow label="선택 요금제" value={plan.name} />
            <ListRow label="월 요금" value={formatPrice(plan.price)} />
          </section>
          <div className="fields">
            {/* 이름 입력: 한글/영문/공백 외의 글자는 입력되자마자 지웁니다 */}
            <label className="field">
              <span>이름</span>
              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value.replace(
                      /[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s]/g,
                      "",
                    ),
                  )
                }
                placeholder="이름을 입력해주세요"
                autoComplete="name"
                inputMode="text"
              />
            </label>
            {/* 휴대폰 번호 입력: 입력할 때마다 handlePhone이 하이픈을 넣어 줌 */}
            <label className="field">
              <span>휴대폰 번호</span>
              <input
                value={phone}
                onChange={(event) => handlePhone(event.target.value)}
                placeholder="010-0000-0000"
                inputMode="numeric" // 모바일에서 숫자 키패드 표시
                autoComplete="tel"
              />
            </label>
            {/* 동의 체크박스: 실제 체크박스는 숨기고 꾸민 모양(check-control)을 보여줌 */}
            <label className="agreement">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span className="check-control" aria-hidden="true">
                {agreed && <img src="/assets/e8d68.svg" alt="" />}
              </span>
              <span>[필수] 개인정보 수집·이용에 동의합니다</span>
            </label>
          </div>
        </div>
        <BottomCta>
          {/* 입력이 올바르지 않으면(valid가 false) 버튼이 비활성화됩니다 */}
          <Button type="submit" disabled={!valid}>
            신청하기
          </Button>
        </BottomCta>
      </form>
    </main>
  )
}

// [화면 4] 신청 완료 화면. 신청 내역을 보여줍니다.
function CompleteScreen({
  application,
  navigate,
}: {
  application: Application
  navigate: (route: Route) => void
}) {
  // 개인정보 보호를 위해 이름 가운데를 *로 가립니다. (예: 홍길동 → 홍*동)
  const maskedName =
    application.name.length > 1
      ? `${application.name[0]}${"*".repeat(Math.max(1, application.name.length - 2))}${application.name.at(-1)}`
      : application.name
  // 전화번호도 가운데 4자리를 가립니다. (예: 010-1234-5678 → 010-****-5678)
  const phoneDigits = application.phone.replace(/\D/g, "")
  const maskedPhone =
    phoneDigits.length >= 7
      ? `${phoneDigits.slice(0, 3)}-****-${phoneDigits.slice(-4)}`
      : application.phone

  return (
    <main className="screen">
      {/* 뒤로가기는 브라우저의 이전 페이지로 이동 */}
      <Header title="신청 완료" onBack={() => window.history.back()} />
      <div className="scroll-content screen-with-cta complete-content">
        <section className="complete-result">
          <span className="done-mark" aria-hidden="true">
            <img src="/assets/7c149.svg" alt="" />
          </span>
          <h1>구독 신청이 완료됐어요</h1>
          <p>개통 안내는 문자로 보내드려요</p>
        </section>
        <section className="application-card">
          <h2>신청 내역</h2>
          <ListRow label="신청 번호" value={application.number} />
          <ListRow label="요금제" value={application.plan.name} />
          <ListRow
            label="월 요금"
            value={formatPrice(application.plan.price)}
          />
          <ListRow label="신청 일시" value={application.appliedAt} />
          <ListRow label="신청자" value={`${maskedName} · ${maskedPhone}`} />
        </section>
      </div>
      <BottomCta>
        {/* 누르면 요금제 목록 페이지로 완전히 새로 이동 */}
        <Button onClick={() => window.location.assign("/plans")}>
          요금제 더 보기
        </Button>
      </BottomCta>
    </main>
  )
}

// ------------------------------------------------------------
// 6. App : 앱의 시작점. 어떤 화면을 보여줄지 결정하는 "교통정리" 역할
// ------------------------------------------------------------
export default function App() {
  // route : 현재 화면. 처음에는 주소창(URL)을 읽어서 결정합니다.
  const [route, setRoute] = useState<Route>(() => readRoute())
  // application : 제출된 신청 내역 (아직 신청 전이면 null = 비어 있음)
  const [application, setApplication] = useState<Application | null>(null)

  // 화면이 처음 나타날 때 한 번 실행되는 설정 부분
  useEffect(() => {
    // 주소가 "/"이면 "/plans"로 바꿔 줍니다 (기록은 추가하지 않고 교체)
    if (window.location.pathname === "/") {
      window.history.replaceState({}, "", "/plans")
    }
    // 브라우저의 뒤로가기/앞으로가기(popstate)를 누르면 주소에 맞게 화면을 바꿉니다.
    const onPopState = () => setRoute(readRoute())
    window.addEventListener("popstate", onPopState)
    // 정리(cleanup): 화면이 사라질 때 등록했던 감시를 해제합니다.
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  // 다른 화면으로 이동하는 함수 (각 화면에 전달되어 사용됨)
  function navigate(next: Route) {
    window.history.pushState({}, "", pathFor(next)) // 주소창 URL 변경 + 방문 기록 추가
    setRoute(next) // 화면 상태 변경 → 새 화면이 그려짐
    window.scrollTo(0, 0) // 스크롤을 맨 위로
  }

  // 현재 route에 맞는 화면을 골라 보여줍니다.

  // 목록 화면
  if (route.name === "plans") return <PlansScreen navigate={navigate} />

  // 완료 화면
  if (route.name === "complete") {
    // 실제 신청 내역이 있으면 사용하고, 없으면(주소로 직접 들어온 경우 등)
    // 보여주기용 샘플 데이터를 대신 사용합니다. (?? = 왼쪽이 없을 때 오른쪽 사용)
    const completed =
      application ??
      {
        number: "UP20250616-01",
        plan: plans[0],
        name: "신청자",
        phone: "010-0000-0000",
        appliedAt: "2025. 06. 16. 14:30",
      } satisfies Application
    return <CompleteScreen application={completed} navigate={navigate} />
  }

  // 여기까지 왔다면 detail 또는 apply 화면 → planId로 요금제를 찾습니다.
  // 못 찾으면 첫 번째 요금제를 기본으로 사용합니다.
  const selectedPlan =
    plans.find((plan) => plan.id === route.planId) ?? plans[0]

  // 신청서 화면
  if (route.name === "apply") {
    return (
      <ApplyScreen
        plan={selectedPlan}
        navigate={navigate}
        onComplete={(completed) => {
          setApplication(completed) // 신청 내역 저장
          navigate({ name: "complete" }) // 완료 화면으로 이동
        }}
      />
    )
  }

  // 위 경우가 모두 아니면 상세 화면
  return <DetailScreen plan={selectedPlan} navigate={navigate} />
}
