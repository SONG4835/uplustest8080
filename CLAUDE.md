# 요금제 추천·구독 — 화면 구현 하네스

## 서비스 맥락
1. 월말 전에 데이터가 떨어지는 고객이 데이터량을 기준으로 요금제를 비교한다. (US1)
2. 필터로 후보를 4개보다 적게 줄여 본다. (US2)
3. "무제한" 요금제가 소진 후 속도 제한이 있는지 카드·상세에서 바로 확인한다. (US3)
4. 매달 내는 금액 1개와 25개월째부터 내는 금액을 구분해 본다. (US4)
5. 사이트를 벗어나지 않고 이름·휴대폰 번호·동의만으로 신청을 마친다. (US5)

★ 어기면 안 되는 것
- ③ 카드·상세의 금액은 "매달 내는 금액" 1개 + "할인 종료 후 금액" 최대 1개 (→ G3)
- ⑤ "무제한" 요금제의 카드·상세에는 소진 후 속도 문구가 정확히 1번 (→ G4)

## 메인 대화의 역할 (오케스트레이터)
- 직접 구현하지 않는다. app/ 아래 파일을 Write/Edit하지 않는다. (훅이 막는다)
- 하는 일은 세 가지: ① 에이전트 호출 ② `node harness/scripts/verify.mjs --stage S<n>` 실행 ③ state.json 갱신·커밋.
- 상위 폴더 `Downloads/AGENTS.md`(Figma Make 안내)는 이 프로젝트에 적용하지 않는다.

## 우선순위
- 내용·동작·데이터: PRD.md > screens.md > flow.png
- 비주얼: tokens.json(SSOT) > Design.md
- reference/ = 레이아웃 참고용. 데이터·문구 복사 금지.
- docs/·reference/ = 읽기 전용. (G0 + 훅)

## 준비 (최초 1회)
```
node harness/scripts/scaffold.mjs --install
node harness/scripts/gen-tokens.mjs
```

## 파이프라인
| 단계 | 에이전트 | 출력 | 통과 게이트 (`verify.mjs --stage`) |
|---|---|---|---|
| S1 | spec-reader | harness/out/spec/01-spec.json | G0, S1-shape, G2-spec |
| S2 | page-planner | harness/out/pages/02-pages.json | G0, G1-pages, G8-pages |
| S3 | component-builder | app/src/components/*.tsx ×17 | G0, G7, G8, G9 (components 범위) |
| S4 | screen-builder | app/src/screens/* | G0~G10 전체 |
| S5 | verifier → 사람 | 05-verify.json, shots/*.png | G0~G10 전체 + 사람 승인 |

한 단계 진행 순서:
1. 에이전트 호출 → 2. verifier 호출(`--stage S<n>`) → 3. 통과 시 `node harness/scripts/state.mjs passed S<n>` → 4. 커밋 `harness(S<n>): <요약> [try <k>]`
실패 시 verifier가 보고한 `복귀 단계`의 에이전트를 실패 detail과 함께 다시 호출한다.

## 게이트 규칙
| ID | 막는 것 | 복귀 |
|---|---|---|
| G0 | docs/·reference/ 변경 | 즉시 중단, 사용자 보고 |
| G1 | 라우트 수 ≠ 화면 수(4), 별도 상태 화면 | S2 (routes.tsx 없음은 S4) |
| G2 | spec·plans.ts 값 ≠ PRD 표 | spec 틀림 S1 / 코드 틀림 S4 |
| ★G3 | 금액 3개 이상, data-price 밖 금액 | S4, 즉시 중단 |
| ★G4 | 무제한 요금제 속도 문구 0개·2개 이상 | S4, 즉시 중단 |
| G5 | PRD 규칙 ①②④⑥⑦, 필터·이동 | S4 |
| G6 | 인라인 예외(잘못된 id, 빈 /complete, 오류 문구) | S4 |
| G7 | 토큰 밖 값 | components S3 / screens S4 |
| G8 | 17종 밖 컴포넌트 | components S3 / screens S4 |
| G9 | tsc·eslint·vite build 실패 | 해당 단계 |
| G10 | 코드에 쓴 클래스가 빌드 CSS에 없음 (Tailwind가 조용히 버린 값) | components S3 / screens S4 |

- verify exit 3 = 같은 게이트 연속 3회 실패 → 멈추고 05-verify.json 요약을 사용자에게 보여준다.
- 판정은 verifier 보고와 verify.mjs exit code로만 한다. 메인이 "대충 맞다"고 판단하지 않는다.
- 브랜치: harness/screens. 게이트 통과 = 커밋 1번.

## 사람 승인 (1곳)
S5 verify 통과 → `node harness/scripts/screenshot.mjs` → 스크린샷 4장을 사용자에게 보여준다.
- "승인" → `state.mjs approve` → 커밋 `harness(S5): approved`
- "거절: <사유>" → 색·간격·모서리면 `state.mjs reject visual "<사유>"`(S3), 배치·문구·동작이면 `reject flow "<사유>"`(S4)

## 값 규칙 (G7, 훅이 실시간 거부)
- 색·글자·간격·radius = tokens.json 값만. hex·rgb()·style=·Tailwind [임의값] 금지.
- width·height = components/ 안에서만, Design.md에 있는 px 숫자만. screens/는 w-full만.
- 화면 구성 = Design.md 17종 + HTML 기본 태그 + Navigate/Fragment.
- DOM 표식은 harness/CONTRACT.md를 따른다.
- 테스트·예시 입력은 누가 봐도 가짜인 값만 쓴다. 실제 고객 정보는 쓰지 않는다.

## 수정 금지 (훅)
harness/checks · lib · scripts · hooks, harness/CONTRACT.md, .claude/, CLAUDE.md, app/src/styles/tokens.css.
하네스 자체를 고칠 때만 사용자가 `HARNESS_MAINTENANCE=1`로 Claude Code를 실행한다.

## 부르는 말
- "화면 만들어줘" → `state.mjs resume` 확인 후 해당 단계부터 진행
- "S<n>부터 다시" → `state.mjs stage S<n>` 후 진행
- "검증만" → verifier만 호출
- "승인" / "거절: <사유>" → 위 사람 승인 절차
