/**
 * App.tsx - U+ 요금제 구독 신청 앱의 전체 화면을 담은 파일.
 *
 * 흐름: 요금제 목록(/plans) -> 요금제 상세(/plans/아이디) -> 신청 정보 입력(/apply) -> 신청 완료(/complete)
 * 화면마다 "컴포넌트(화면 조각을 만드는 함수)"가 하나씩 있고, 맨 아래 App이 현재 주소(URL)에 맞는 화면을 골라 보여준다.
 * 별도 라우터 라이브러리 없이 브라우저의 history(주소 기록) 기능으로 화면 전환을 직접 구현했다.
 * 요금제 데이터는 서버 없이 아래 plans 배열에 직접 적어두었다.
 */
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"

// Route = "지금 어느 화면인가"를 나타내는 타입(값의 모양 약속).
// 예) { name: "detail", planId: "light" } -> 라이트 30 상세 화면. name으로 화면을 구분한다.
type Route = { name: "plans" } | { name: "detail" planId: string } | {
  name: "apply"
  planId: string
} | { name: "complete" }

// Plan = 요금제 하나의 정보. 물음표(?)가 붙은 항목은 없어도 되는 선택 항목이다(예: 할인이 없는 요금제).
type Plan = {
  id: string
  name: string
  price: number
  originalPrice?: number
  discount?: string
  data: string
  description: string
  badge?: string
  promo?: string
  categories: Array<"데이터 많이" | "가성비" | "구독 포함" | "통화 많이">
  benefits: string[]
}

// Application = 사용자가 신청을 마친 뒤 완료 화면에 보여줄 신청 내역.
type Application = {
  number: string
  plan: Plan
  name: string
  phone: string
  appliedAt: string
}

// 화면에 보여줄 요금제 목록(임시 데이터). 서버 대신 코드 안에 고정값으로 넣어두었다.
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

// 필터 버튼 이름 목록. "as const"는 이 값들을 바뀌지 않는 고정 글자로 취급해, 위 categories에 없는 이름을 쓰면 오류가 나게 해준다.
const filters = ["데이터 많이", "가성비", "구독 포함", "통화 많이"] as const

// 숫자를 원화 문자열로 바꾼다. 예) 85000 -> "85,000원" (천 단위 쉼표는 toLocaleString이 넣어준다)
function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`
}

// 현재 브라우저 주소(URL)를 읽어 어느 화면을 보여줄지 Route로 바꿔준다.
// 정규식 /^\/plans\/([^/]+)$/ : "/plans/" 뒤에 슬래시 없는 글자가 오는 주소만 찾고, 그 글자를 괄호로 뽑아낸다.
// 예) "/plans/light" -> match[1] = "light" (상세 화면). 주소를 모르면 기본값으로 목록 화면을 보여준다.
// ?? 는 "왼쪽 값이 없으면 오른쪽 값을 쓴다"는 뜻. 예) /apply?plan=slim 에서 plan 값을 꺼내고, 없으면 첫 번째 요금제를 쓴다.
function readRoute(): Route {
  const path = window.location.pathname
  const match = path.match(/^\/plans\/([^/]+)$/)

  if (match) return { name: "detail", planId: match[1] }
  if (path === "/apply") {
    return {
      name: "apply",
      planId:
        new URLSearchParams(window.location.search).get("plan") ?? plans[0].id,
    }
  }
  if (path === "/complete") return { name: "complete" }
  return { name: "plans" }
}

// readRoute의 반대 방향: Route를 주소 문자열로 바꾼다. 예) { name: "detail", planId: "slim" } -> "/plans/slim"
function pathFor(route: Route) {
  if (route.name === "plans") return "/plans"
  if (route.name === "detail") return `/plans/${route.planId}`
  if (route.name === "apply") return `/apply?plan=${route.planId}`
  return "/complete"
}

// 화면 맨 위 헤더. root가 true면 첫 화면용(제목 + 로고), 아니면 뒤로가기 버튼 + 제목을 보여준다.
// onBack: 뒤로가기 버튼을 눌렀을 때 실행할 함수(콜백 = 나중에 실행해 달라고 넘겨주는 함수).
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

// 공통 버튼. variant로 주요(primary)/보조(secondary) 모양을 고르고, disabled가 true면 눌러도 반응하지 않는다.
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

// 필터 칩(둥근 선택 버튼) 하나. selected가 true면 선택된 모양으로 바뀐다.
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
      aria-pressed={selected}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

// 작은 라벨(예: "추천")을 보여주는 조각.
function Tag({ children }: { children: ReactNode }) {
  return <span className="tag w-fit self-start">{children}</span>
}

// "라벨 - 값" 한 줄. check가 true면 체크 아이콘이 붙은 혜택 목록 모양으로 보인다.
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
      {check && (
        <img className="benefit-bullet" src="/assets/d5cc2.svg" alt="" />
      )}
      <span className={check ? "list-row-value" : "list-row-label"}>
        {label}
      </span>
      {value && <span className="list-row-value">{value}</span>}
    </div>
  )
}

// 화면 아래에 붙어 있는 버튼 영역. summary(요금 요약)를 넘기면 버튼 위쪽에 금액 문구가 함께 나온다.
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

// 목록에 나오는 요금제 카드 한 장. onDetail은 "자세히" 버튼을 눌렀을 때 실행할 함수.
function PlanCard({ plan, onDetail }: { plan: Plan onDetail: () => void }) {
  return (
    <article className="plan-card">
      {plan.badge && <Tag>{plan.badge}</Tag>}
      <span className="plan-name">{plan.name}</span>
      <span className="plan-description">{plan.description}</span>
      <div className="plan-price-row">
        <div className="plan-price-group">
          <div className="current-price">
            {plan.discount && (
              <strong className="discount">{plan.discount}</strong>
            )}
            <strong>월 {formatPrice(plan.price)}</strong>
          </div>
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

// 요금제 목록 화면. navigate는 다른 화면으로 이동시키는 함수(App에서 내려받는다).
function PlansScreen({ navigate }: { navigate: (route: Route) => void }) {
  // useState = 화면이 기억할 값. [현재값, 값을 바꾸는 함수] 한 쌍을 돌려준다. 값이 바뀌면 화면이 다시 그려진다.
  // 여기서는 선택된 필터를 기억하고, 처음엔 "데이터 많이"가 선택돼 있다.
  const [filter, setFilter] = useState<typeof filters[number]>("데이터 많이")
  // useMemo = 계산 결과를 기억해 두는 도구. filter가 바뀔 때만 다시 거르고, 아니면 이전 결과를 재사용한다.
  // 선택한 필터(카테고리)를 가진 요금제만 골라낸다.
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
        <div className="filter-list" aria-label="요금제 필터">
          {filters.map((item) => (
            <FilterChip
              key={item}
              label={item}
              selected={filter === item}
              onClick={() => setFilter(item)}
            />
          ))}
        </div>
        <section className="plan-list">
          <p className="list-meta">추천순 · {visiblePlans.length}개</p>
          {visiblePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onDetail={() => navigate({ name: "detail", planId: plan.id })}
            />
          ))}
        </section>
      </div>
    </main>
  )
}

// 요금제 상세 화면. 선택한 plan의 가격·기본 제공·혜택을 보여주고, 아래 버튼으로 신청 화면에 이동한다.
function DetailScreen({
  plan,
  navigate,
}: {
  plan: Plan
  navigate: (route: Route) => void
}) {
  return (
    <main className="screen">
      <Header title="요금제 상세" onBack={() => navigate({ name: "plans" })} />
      <div className="scroll-content screen-with-price-cta">
        <section className="detail-title">
          {plan.badge && <Tag>{plan.badge}</Tag>}
          <h1>{plan.name}</h1>
          <p>{plan.description}</p>
        </section>
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
          {plan.benefits.map((benefit) => (
            <ListRow key={benefit} label={benefit} value="포함" check />
          ))}
        </section>
      </div>
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

// 신청 정보 입력 화면. 이름·휴대폰 번호·동의 체크를 모두 채워야 신청 버튼이 켜진다.
// 입력 정리 규칙: 이름 입력칸은 한글·영문·공백 외의 글자(숫자, 특수문자)를 입력 즉시 지운다.
// onComplete: 신청이 끝나면 신청 내역을 부모(App)에게 전달하는 함수.
function ApplyScreen({
  plan,
  navigate,
  onComplete,
}: {
  plan: Plan
  navigate: (route: Route) => void
  onComplete: (application: Application) => void
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [agreed, setAgreed] = useState(false)
  // 신청 가능 조건: 이름 2글자 이상 + 숫자만 뽑은 번호가 10자리 이상 + 동의 체크. 하나라도 모자라면 false.
  // 예) phone "010-1234-5678".replace(/\D/g, "") -> "01012345678" (\D = 숫자가 아닌 글자, 전부 제거)
  const valid =
    name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10 && agreed

  // 입력한 번호를 하이픈 형식으로 자동 정리한다. 숫자만 남기고 최대 11자리까지만 자른 뒤 길이에 따라 하이픈을 넣는다.
  // 예) "01012345678" -> "010-1234-5678", "0101234" -> "010-1234", "010" -> "010"
  function handlePhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    const formatted =
      digits.length < 4
        ? digits
        : digits.length < 8
          ? `${digits.slice(0, 3)}-${digits.slice(3)}`
          : `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    setPhone(formatted)
  }

  // 신청 버튼(폼 제출)을 눌렀을 때 실행된다. event.preventDefault()는 브라우저가 페이지를 새로고침하는 기본 동작을 막는다.
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    const now = new Date()
    onComplete({
      // 신청 번호를 오늘 날짜로 만든다. padStart(2, "0")는 한 자리 숫자 앞에 0을 채운다(월은 0부터 시작해서 +1).
      // 예) 2025년 6월 16일 -> "UP20250616-01" (뒤의 -01은 고정값)
      number: `UP${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-01`,
      plan,
      name: name.trim(),
      phone,
      // 날짜를 한국식 "2025. 06. 16. 14:30" 모양으로 바꾼다(hour12: false = 24시간제).
      appliedAt: new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now),
    })
  }

  return (
    <main className="screen">
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
          <section className="apply-summary">
            <ListRow label="선택 요금제" value={plan.name} />
            <ListRow label="월 요금" value={formatPrice(plan.price)} />
          </section>
          <div className="fields">
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
            <label className="field">
              <span>휴대폰 번호</span>
              <input
                value={phone}
                onChange={(event) => handlePhone(event.target.value)}
                placeholder="010-0000-0000"
                inputMode="numeric"
                autoComplete="tel"
              />
            </label>
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
          <Button type="submit" disabled={!valid}>
            신청하기
          </Button>
        </BottomCta>
      </form>
    </main>
  )
}

// 신청 완료 화면. 개인정보 보호를 위해 이름과 번호 일부를 *로 가려서 보여준다.
function CompleteScreen({
  application,
  navigate,
}: {
  application: Application
  navigate: (route: Route) => void
}) {
  // 이름 가운데를 *로 가린다. 예) "홍길동" -> "홍*동", "김철" -> "김*철"처럼 첫·끝 글자만 남긴다.
  // (이름이 2글자면 Math.max로 최소 *를 1개 보장한다.)
  const maskedName =
    application.name.length > 1
      ? `${application.name[0]}${"*".repeat(Math.max(1, application.name.length - 2))}${application.name.at(-1)}`
      : application.name
  // 번호는 앞 3자리와 뒤 4자리만 남긴다. 예) "01012345678" -> "010-****-5678"
  const phoneDigits = application.phone.replace(/\D/g, "")
  const maskedPhone =
    phoneDigits.length >= 7
      ? `${phoneDigits.slice(0, 3)}-****-${phoneDigits.slice(-4)}`
      : application.phone

  return (
    <main className="screen">
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
        <Button onClick={() => window.location.assign("/plans")}>
          요금제 더 보기
        </Button>
      </BottomCta>
    </main>
  )
}

// 앱의 최상위 컴포넌트. 현재 주소(route)에 따라 어떤 화면을 보여줄지 정하고, 화면 이동 함수(navigate)를 나눠준다.
export default function App() {
  const [route, setRoute] = useState<Route>(() => readRoute())
  const [application, setApplication] = useState<Application | null>(null)

  // useEffect = 화면이 처음 나타난 뒤 한 번 실행되는 코드를 적는 곳(두 번째 인자 []가 "한 번만"이라는 뜻).
  // 1) 첫 주소 "/"는 "/plans"로 바꿔 놓고, 2) 브라우저 뒤로/앞으로 가기(popstate)를 누르면 화면도 따라 바꾼다.
  // return 안의 함수는 화면이 사라질 때 실행되는 "뒷정리"로, 등록한 이벤트 감지를 해제한다.
  useEffect(() => {
    if (window.location.pathname === "/") {
      window.history.replaceState({}, "", "/plans")
    }
    const onPopState = () => setRoute(readRoute())
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  // 화면 이동: 주소창을 바꾸고(pushState), 화면 상태를 갱신하고, 스크롤을 맨 위로 올린다.
  function navigate(next: Route) {
    window.history.pushState({}, "", pathFor(next))
    setRoute(next)
    window.scrollTo(0, 0)
  }

  if (route.name === "plans") return <PlansScreen navigate={navigate} />

  if (route.name === "complete") {
    // 신청 없이 /complete 주소로 직접 들어온 경우를 대비해, 신청 내역이 없으면 샘플 내역을 대신 보여준다.
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

  // 주소에 적힌 요금제를 찾고, 없는 아이디면 첫 번째 요금제를 대신 사용한다.
  const selectedPlan =
    plans.find((plan) => plan.id === route.planId) ?? plans[0]

  if (route.name === "apply") {
    return (
      <ApplyScreen
        plan={selectedPlan}
        navigate={navigate}
        onComplete={(completed) => {
          setApplication(completed)
          navigate({ name: "complete" })
        }}
      />
    )
  }

  return <DetailScreen plan={selectedPlan} navigate={navigate} />
}
