# DOM 계약 (판정 스크립트가 세는 표식)

component-builder · screen-builder가 지켜야 하고, `harness/checks/prd-rules.test.tsx`가 이 표식으로 DOM을 센다.
이 파일은 판정 기준이므로 에이전트는 수정하지 않는다.

## 데이터 속성

| 표식 | 붙이는 곳 | 값 |
|---|---|---|
| `data-plan-card="<id>"` | Card/Plan 루트 | p01 ~ p04 |
| `data-plan-detail="<id>"` | 요금제 상세 본문 루트 (BottomCTA 제외) | p01 ~ p04 |
| `data-bottom-cta` | BottomCTA 루트 | (값 없음) |
| `data-price="monthly"` | "매달 내는 금액" 금액 텍스트를 감싼 요소 | 예: `52,000원` |
| `data-price="after-discount"` | "할인 종료 후 금액" 텍스트를 감싼 요소 | 예: `25개월째부터 69,000원` |
| `data-tag="recommended"` | 추천 Tag 루트 | (값 없음) |
| `data-throttle` | 소진 후 속도 문구를 감싼 요소 | `소진 후 5Mbps로 제한` 또는 `속도 제한 없음` |

- `원`이 붙은 금액 텍스트는 반드시 `data-price` 요소 안에만 둔다. 밖에 있으면 ★G3 실패.
- 카드 1개, 상세 본문 1개마다 `monthly` 정확히 1개, `after-discount` 0~1개.
- BottomCTA 안에는 `monthly` 최대 1개(상세 본문과 같은 값), `after-discount` 0개.

## 접근성 이름 (테스트가 찾는 방법)

| 요소 | 찾는 방법 |
|---|---|
| 뒤로 아이콘 버튼 | `role=button`, `aria-label="뒤로"` |
| 필터 칩 | `role=button`, 텍스트 = 칩 이름, 선택 시 `aria-pressed="true"` |
| '자세히' / '구독 신청하기' / '신청하기' / '요금제 더 보기' | `role=button`, 텍스트 그대로 |
| 이름 입력란 | `<label>` 텍스트 `이름` |
| 휴대폰 번호 입력란 | `<label>` 텍스트 `휴대폰 번호` |
| 동의 체크박스 | `role=checkbox`, 이름에 `개인정보 수집·이용` 포함 |
| 비활성 버튼 | `disabled` 속성 |

## 이동 규칙

- 상세 → 신청: `/apply?plan=<id>`
- 라우터: react-router `createBrowserRouter`(앱) / `createMemoryRouter`(테스트). `app/src/screens/routes.tsx`가 `export const routes: RouteObject[]`를 내보낸다.
- routes.tsx의 path는 screens.md의 라우트와 같고, `[id]`는 `:id`로 쓴다.
