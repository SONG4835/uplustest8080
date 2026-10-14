# Design.md

현재 Figma의 로컬 변수, 텍스트 스타일, Components 섹션 및 모바일 화면 템플릿을 기준으로 작성했다.

- 변수 컬렉션: primitive, semantic, typography, spacing, radius
- 모든 컬렉션의 모드: Default 1개
- 텍스트 스타일: 15개
- Components: 컴포넌트 세트 11개, 단일 컴포넌트 6개
- 기준 화면: 390×844px
- 아래 사용처는 Components와 화면 템플릿에서 확인한 적용 사례다.
- 사용처가 확인되지 않은 항목은 별도로 표시한다.

## 1. 색 팔레트

semantic 컬렉션의 색은 primitive 컬렉션을 참조한다.
같은 색 값을 가진 토큰도 이름과 역할이 다르므로 별도 토큰으로 유지한다.

### 텍스트

| semantic 토큰 | 참조 primitive | 값 | 확인된 사용처 |
|---|---|---|---|
| text/primary | gray/900 | #181A1B | 입력값, 버튼 라벨, 요금제 이름과 가격 등 주요 텍스트 |
| text/secondary | gray/600 | #66707A | List/Row 라벨, 요금제 설명 등 보조 정보 |
| text/tertiary | gray/500 | #878787 | 기존 요금, Card/Price의 보조 정보 |
| text/on-dark | gray/0 | #FFFFFF | Primary 버튼과 package Chip 라벨 |
| text/accent | pink/500 | #FF2E98 | 할인율, 포함 혜택의 값, StepProgress 단계 문구 |
| text/error | red/500 | #E30036 | Input의 오류 안내 |
| text/placeholder | gray/400 | #B7BDC4 | Input의 안내·플레이스홀더 텍스트 |
| text/on-disabled | gray/600 | #66707A | disabled Input의 텍스트 |

### 배경과 표면

| semantic 토큰 | 참조 primitive | 값 | 확인된 사용처 |
|---|---|---|---|
| bg/surface | gray/0 | #FFFFFF | Header, BottomCTA |
| bg/default | gray/100 | #F7F7F7 | 요금제 목록 화면, Card/Price, selected OptionItem |
| bg/subtle | gray/200 | #EFF1F3 | disabled Input, Secondary 버튼 Hover, StepProgress 트랙 |
| bg/inverse | gray/800 | #2D2D2D | 조사한 컴포넌트·템플릿에서 바인딩 미확인 |
| bg/accent-subtle | pink/50 | #FFF5FA | sale Chip 배경 |
| bg/error-subtle | red/50 | #FFF0F3 | 조사한 컴포넌트·템플릿에서 바인딩 미확인 |
| surface/default | gray/0 | #FFFFFF | Secondary 버튼 Default 배경 |

### 테두리

| semantic 토큰 | 참조 primitive | 값 | 확인된 사용처 |
|---|---|---|---|
| border/default | gray/300 | #D9DCDF | 기본 Input, Secondary 버튼, 비선택 OptionItem |
| border/subtle | gray/200 | #EFF1F3 | List/Row, BottomCTA 구분선; Tag 배경에도 사용 |
| border/strong | gray/900 | #181A1B | 조사한 컴포넌트·템플릿에서 바인딩 미확인 |
| border/divider | black/10 | rgba(0, 0, 0, 0.10) | 조사한 컴포넌트·템플릿에서 바인딩 미확인 |
| border/focus | pink/500 | #FF2E98 | focus Input |
| border/error | red/500 | #E30036 | caution Input |
| border/medium | gray/600 | #66707A | selected Card/Plan과 OptionItem |

### 컨트롤 채움

| semantic 토큰 | 참조 primitive | 값 | 확인된 사용처 |
|---|---|---|---|
| fill/primary | pink/500 | #FF2E98 | Primary 버튼 Default, active Checkbox, selected OptionItem의 선택 표시 |
| fill/secondary | gray/900 | #181A1B | package Chip, selected FilterChip |
| fill/tertiary | gray/200 | #EFF1F3 | 조사한 컴포넌트·템플릿에서 바인딩 미확인 |
| fill/disabled | gray/300 | #D9DCDF | Primary 버튼 Disabled |
| fill/disabled-strong | gray/400 | #B7BDC4 | 조사한 컴포넌트·템플릿에서 바인딩 미확인 |
| fill/primary-hover | pink/600 | #E6007E | Primary 버튼 Hover |

### 아이콘과 브랜드

| semantic 토큰 | 참조 primitive | 값 | 확인된 사용처 |
|---|---|---|---|
| icon/default | gray/600 | #66707A | icon/arrowLeft 내부 화살표 |
| icon/strong | gray/900 | #181A1B | 조사한 컴포넌트·템플릿에서 바인딩 미확인 |
| icon/accent | pink/500 | #FF2E98 | List/Row의 혜택 표시; sale Chip 라벨에도 사용 |
| icon/on-dark | gray/0 | #FFFFFF | 선택 표시 내부 점, icon/arrowLeft 프레임 채움 |
| icon/disabled | gray/300 | #D9DCDF | 조사한 컴포넌트·템플릿에서 바인딩 미확인 |
| icon/error | red/500 | #E30036 | 조사한 컴포넌트·템플릿에서 로컬 토큰 바인딩 미확인 |
| icon/primary | gray/950 | #000000 | 조사한 컴포넌트·템플릿에서 바인딩 미확인 |
| brand/primary | pink/500 | #FF2E98 | Logo |

### 적용 기준과 확인 사항

- 색 역할에 맞는 semantic 토큰을 우선 사용한다.
- bg/surface와 surface/default는 같은 값이지만 실제 바인딩은 구분되어 있다.
- 현재 selected Card/Plan과 OptionItem의 외곽선은 분홍색이 아니라 border/medium이다.
- 토큰 이름과 실제 적용 대상이 항상 일치하지는 않는다.
  - Tag 배경: border/subtle
  - sale Chip 텍스트: icon/accent
- Input 오류 아이콘에는 로컬 변수 목록에서 해석되지 않는 외부 변수 참조가 있다. 이를 로컬 icon/error 바인딩으로 간주하지 않는다.
- 별도의 다크 모드는 등록되어 있지 않다.

## 2. 타이포 스케일

### 공통 설정

- 폰트: Noto Sans KR
- 폰트 변수: font-family/family-font
- 모든 등록 텍스트 스타일의 자간: 0%
- 줄높이 단위: px
- 굵기: Medium 500, SemiBold 600, Bold 700

### 텍스트 스타일

| 텍스트 스타일 | 크기 / 줄높이 | 굵기 | 확인된 사용처 |
|---|---:|---|---|
| heading/h1 | 32 / 44px | Bold 700 | Components·화면 템플릿에서 적용 미확인 |
| heading/h2 | 28 / 40px | Bold 700 | 요금제 상세 이름, Card/Price의 주 가격 |
| heading/h3 | 24 / 32px | Bold 700 | 목록 안내 제목, 신청 입력 제목, 완료 제목 |
| heading/h4 | 20 / 28px | Medium 500 | Components·화면 템플릿에서 적용 미확인 |
| subtitle/bold | 18 / 26px | Bold 700 | Card/Plan의 이름·가격·할인율, BottomCTA 금액, selected OptionItem 제목 |
| subtitle/default | 18 / 26px | SemiBold 600 | Header 제목 |
| body/strong | 16 / 24px | SemiBold 600 | Input 텍스트, Primary 버튼 라벨, 기본 OptionItem 제목 |
| body/medium | 16 / 24px | Medium 500 | Secondary 버튼 라벨 |
| body/small-strong | 14 / 21px | SemiBold 600 | List/Row 값, selected FilterChip |
| body/small-medium | 14 / 21px | Medium 500 | List/Row 라벨, 요금제 설명, OptionItem 설명, 기본 FilterChip, BottomCTA 금액 라벨 |
| caption/bold | 13 / 18px | Bold 700 | Tag, sale Chip, StepProgress 단계 문구 |
| caption/medium | 13 / 18px | Medium 500 | 기존 가격, Card/Price 라벨·프로모션 안내 |
| caption/small | 12 / 16px | Medium 500 | Components·화면 템플릿에서 적용 미확인 |
| caption/small-bold | 12 / 16px | Bold 700 | Components·화면 템플릿에서 적용 미확인 |
| caption/mini | 10 / 14px | SemiBold 600 | benefit·package Chip |

### 폰트 크기 변수

| 변수 | 값 |
|---|---:|
| font-size/heading-h1 | 32px |
| font-size/heading-h2 | 28px |
| font-size/heading-h3 | 24px |
| font-size/heading-h4 | 20px |
| font-size/subtitle | 18px |
| font-size/body | 16px |
| font-size/body-small | 14px |
| font-size/caption | 13px |
| font-size/caption-mini | 10px |

### 적용 기준과 확인 사항

- 제목·본문·보조 정보는 등록된 텍스트 스타일을 기준으로 지정한다.
- 같은 크기라도 라벨과 강조 값은 서로 다른 굵기 스타일을 사용한다.
- 12px 스타일은 존재하지만 대응하는 12px 폰트 크기 변수는 등록되어 있지 않다.
- 일부 텍스트에는 스타일과 별개로 폰트 크기 변수가 적용되어 있다. 최종 크기는 텍스트 스타일 이름만으로 판단하지 않고 실제 적용값을 함께 확인한다.

## 3. 간격·레이아웃

### 간격 변수

| 변수 | 값 | 확인된 주요 사례 |
|---|---:|---|
| spacing/4 | 4px | Chip 세로 패딩, Card/Price 내부 간격 |
| spacing/8 | 8px | 제목과 설명 간격, Header 내부 간격, 카드 내부 간격 |
| spacing/10 | 10px | Input 내부 간격, sale Chip 좌우 패딩 |
| spacing/12 | 12px | 목록 카드 간격, List/Row 세로 패딩, BottomCTA 내부 간격 |
| spacing/16 | 16px | 화면 좌우 여백, Header·BottomCTA 좌우 패딩 |
| spacing/20 | 20px | 카드 내부 패딩, 신청 폼 항목 간격 |
| spacing/24 | 24px | 본문 상하 패딩, 본문 섹션 간격, 버튼 좌우 패딩 |
| spacing/32 | 32px | BottomCTA 하단 패딩 |
| spacing/40 | 40px | Components·템플릿에서 바인딩 미확인 |
| spacing/48 | 48px | Components·템플릿에서 바인딩 미확인 |
| spacing/80 | 80px | Components·템플릿에서 바인딩 미확인 |

모든 간격이 변수에 연결된 것은 아니다. 위 표의 사례와 동일한 값이 고정값으로 적용된 곳도 있다.

### 모서리 반경 변수

| 변수 | 값 | 확인된 주요 사례 |
|---|---:|---|
| radius/4 | 4px | benefit·package Chip |
| radius/8 | 8px | Button |
| radius/12 | 12px | OptionItem, Card/Price |
| radius/16 | 16px | Card/Plan |
| radius/20 | 20px | Components·템플릿에서 바인딩 미확인 |
| radius/24 | 24px | Components·템플릿에서 바인딩 미확인 |
| radius/32 | 32px | Components·템플릿에서 바인딩 미확인 |
| radius/full | 9999px | 선택 표시, StepProgress 트랙 |

고정 반경 사례:
- FilterChip: 9999px
- icon/doneMark: 9999px
- Tag: 999px
- sale Chip: 6px
- Input field: 0px

### 390×844px 화면 구조

- 화면 루트: 세로 Auto Layout
- 루트 패딩과 요소 간격: 0px
- Header: 너비 390px, 높이 56px
- 본문: 너비 390px, 남는 세로 공간을 채움
- 본문 패딩: 상하 24px, 좌우 16px
- 본문 유효 너비: 358px
- 본문 주요 섹션 간격: 24px
- 제목과 설명 간격: 8px
- 하단 CTA가 있는 화면은 Header → 본문 → BottomCTA 순서로 구성된다.

| 화면 | Header 높이 | 본문 높이 | BottomCTA 높이 |
|---|---:|---:|---:|
| 요금제 목록 | 56px | 788px | 없음 |
| 요금제 상세 | 56px | 649px | 139px |
| 구독 신청 | 56px | 691px | 97px |
| 신청 완료 | 56px | 691px | 97px |

### 화면별 구성 간격

- 요금제 목록
  - FilterChip은 가로 배치와 줄바꿈을 사용한다.
  - 칩 가로 간격: 4px
  - 칩 줄 간격: 8px
  - 요금제 목록 항목 간격: 12px
- 요금제 상세
  - 제목, 가격 카드, 기본 제공, 포함 혜택 간격: 24px
  - List/Row 그룹 내부 간격: 0px
- 구독 신청
  - 요금제 요약 패딩: 상하 8px, 좌우 16px
  - 요약 반경: 12px
  - 폼 항목 간격: 20px
- 신청 완료
  - 완료 안내 그룹 간격: 12px
  - 완료 안내 그룹 패딩: 위 24px, 좌우 4px, 아래 8px
  - 신청 내역 패딩: 위 16px, 좌우 16px, 아래 8px
  - 신청 내역 반경: 12px

### 하단 CTA

- single·double
  - 너비: 390px
  - 현재 높이: 97px
  - 패딩: 위 12px, 좌우 16px, 아래 32px
  - 버튼 간격: 8px
- price
  - 너비: 390px
  - 현재 높이: 139px
  - 패딩: 위 16px, 좌우 16px, 아래 32px
  - 금액 행과 버튼 간격: 12px
- 템플릿의 주 버튼: 너비 358px, 높이 52px

### 구현 시 확인 사항

- BottomCTA의 높이는 Auto Layout 결과값이다. 테두리 등을 포함하므로 패딩과 버튼 높이의 단순 합과 차이가 날 수 있다.
- 하단 32px은 현재 디자인 패딩이다. 운영체제의 safe-area 값으로 정의된 것은 아니다.
- 상태바·홈 인디케이터는 별도 UI로 포함되어 있지 않다.
- 요금제 목록은 본문 내부 콘텐츠가 화면 높이를 초과한다.
- 현재 목록 본문은 클리핑이 켜져 있고 스크롤 설정은 NONE이다. 구현에서는 스크롤 영역을 별도로 정의해야 전체 목록을 볼 수 있다.
- 고정 하단 CTA와 본문 스크롤의 동작 정책은 별도 구현 확인이 필요하다.

## 4. 컴포넌트 용법

Components 섹션에는 대표 이름 17개가 있다.
컴포넌트 세트의 변형은 총 44개다.

아래 속성명은 표시 이름을 기준으로 적었다.
TEXT·BOOLEAN 속성의 내부 식별 접미사는 생략했다.

### Header

- 변형: Type=default | root
- 속성:
  - Title: TEXT
  - 기본값: "맞춤 요금제 추천"
- 크기: 390×56px
- 패딩: 상하 4px, 좌우 16px
- 용법:
  - root: 제목과 Logo를 표시하는 루트 화면용
  - default: icon/arrowLeft와 제목을 표시하는 하위 화면용
- default 내부 간격: 8px
- root 내부 간격: 12px
- 템플릿:
  - 목록: root
  - 상세·신청·완료: default
- 뒤로 이동 목적지는 컴포넌트 속성에 정의되어 있지 않다.

### FilterChip

- 변형: State=default | selected
- 속성:
  - Label: TEXT
  - 기본값: "데이터 많이"
- 높이: 40px
- 패딩: 상하 8px, 좌우 16px
- 반경: 9999px
- 용법:
  - 목록의 조건 필터
  - 선택 상태는 selected로 표현
  - selected 배경은 fill/secondary
- 기본 너비는 라벨과 테두리에 따라 달라진다.
- 단일 선택·복수 선택 및 필터 동작은 컴포넌트에 정의되어 있지 않다.

### Tag

- 단일 컴포넌트
- 노출된 컴포넌트 속성: 없음
- 기본 문구: "추천"
- 기본 크기: 48×26px
- 패딩: 상하 4px, 좌우 12px
- 반경: 999px
- 용법:
  - 요금제 추천 배지
  - Card/Plan과 요금제 상세 제목 영역에서 사용
- State 변형은 없다.
- 문구는 노출된 TEXT 속성이 아니라 내부 텍스트 오버라이드로 변경한다.

### Chip

- 변형: Type=benefit | package | sale
- 노출된 별도 TEXT 속성: 없음
- 용법:
  - benefit: 혜택 정보
  - package: 패키지 정보
  - sale: 할인·프로모션 정보
- 기본 문구:
  - benefit: "월 13,500원 상당 혜택"
  - package: "프리미엄 패키지"
  - sale: "4,000원 절약"
- 형태:
  - benefit·package: 높이 20px, 반경 4px
  - sale: 높이 24px, 반경 6px
- 텍스트:
  - benefit·package: caption/mini
  - sale: caption/bold
- 목록에서는 sale 문구를 "24개월 할인 프로모션"으로 오버라이드한다.
- package는 기본 너비가 고정되어 있으므로 긴 문구 적용 시 크기를 확인한다.

### Card/Plan

- 변형: State=default | selected
- TEXT 속성:
  - Name: 요금제 이름
  - Desc: 제공 사항 설명
  - Discount: 할인율
  - Price: 현재 월 요금
  - Original: 기존 월 요금
- BOOLEAN 속성:
  - Badge: 추천 배지 표시
  - Promo: 프로모션 표시
  - Sale: 할인 정보 표시
- BOOLEAN 기본값: 모두 true
- 기본 너비: 358px
- 높이: 콘텐츠에 맞춤
- 패딩: 20px
- 내부 간격: 8px
- 반경: 16px
- 테두리:
  - default: 1px
  - selected: 1.5px, border/medium
- 내부 구성: Tag, Chip, Button
- 용법:
  - 요금제 이름·설명·가격을 한 카드에 표시
  - 할인이나 프로모션이 없는 상품은 해당 표시 속성을 끈다.
  - Price·Original·Discount는 동일한 요금제 데이터로 맞춘다.
- 템플릿의 "자세히" 버튼:
  - Type=Secondary, Size=sm
- 버튼 라벨은 Card/Plan의 자체 TEXT 속성으로 노출되어 있지 않다.

### Card/Price

- 단일 컴포넌트
- 노출된 컴포넌트 속성: 없음
- 기본 크기: 358×124px
- 패딩: 20px
- 내부 간격: 4px
- 반경: 12px
- 배경: bg/default
- 표시 정보:
  - 월 요금 라벨
  - 현재 가격
  - 할인율
  - 기존 월 요금
  - 프로모션 안내
- 용법:
  - 요금제 상세의 가격 요약
  - 가격은 heading/h2로 강조
  - 보조 정보는 caption/medium
- 금액과 문구는 내부 텍스트 오버라이드로 변경한다.

### List/Row

- 변형: Type=default | check
- TEXT 속성:
  - Label: 항목 이름
  - Value: 항목 값
- 기본값:
  - Label: "데이터"
  - Value: "무제한"
- 기본 너비: 358px
- 기본 높이: 46px
- 패딩: 상하 12px, 좌우 4px
- 내부 간격: 12px
- 용법:
  - default: 데이터·통화·문자, 월 요금, 신청 내역 등의 이름–값 행
  - check: 포함 혜택 행
- check는 현재 분홍색 원형 bullet을 포함한다. icon/check를 사용하는 구조는 아니다.
- 좁은 컨테이너에서는 부모 너비에 맞춰 적용한다.

### OptionItem

- 변형: State=default | selected
- TEXT 속성:
  - Title
  - Desc
- 기본값:
  - Title: "데이터를 많이 써요"
  - Desc: "영상·게임을 자주 봐서 무제한이 필요해요"
- 기본 너비: 358px
- 패딩: 상하 16px, 좌우 20px
- 내부 간격: 12px
- 반경: 12px
- 테두리:
  - default: 1px
  - selected: 1.5px, border/medium
- 선택 표시: 22×22px
- selected:
  - 배경: bg/default
  - 선택 표시: fill/primary와 흰색 내부 점
  - 제목: subtitle/bold
- 용법:
  - 설명을 포함한 선택 항목
  - 선택 여부는 State로 표시
- 현재 4개 화면 템플릿에는 사용되지 않았다.
- 선택 그룹의 단일·복수 선택 정책은 별도 정의가 필요하다.

### StepProgress

- 변형: Step=1 | 2 | 3
- 별도 TEXT 속성: 없음
- 기본 크기: 358×30px
- 라벨과 트랙 간격: 8px
- 트랙 높이: 4px
- 트랙 반경: radius/full
- 단계 문구:
  - STEP 1 / 3
  - STEP 2 / 3
  - STEP 3 / 3
- 진행 막대 너비:
  - Step=1: 119px
  - Step=2: 239px
  - Step=3: 358px
- 용법:
  - 3단계 흐름의 현재 단계를 표시
  - 단계 변경 시 Step 변형을 바꾼다.
- 현재 4개 화면 템플릿에는 사용되지 않았다.
- 4단계 이상이나 임의 퍼센트 변형은 등록되어 있지 않다.

### Button

- 변형:
  - Type=Primary | Secondary
  - Size=sm | lg | xl
  - State=Default | Hover | Disabled
- 총 18개 조합
- TEXT 속성:
  - Label
  - 기본값: "로그인"
- 반경: 8px
- 좌우 패딩: 24px
- 크기:
  - sm: 기본 높이 40px, 상하 패딩 8px
  - lg: 높이 48px, 상하 패딩 12px
  - xl: 높이 52px, 상하 패딩 16px
- 확인된 예외:
  - Secondary sm의 Default·Hover는 현재 높이 42px
  - 모든 sm 변형을 40px로 동일하게 기록하지 않는다.
- 색:
  - Primary Default: fill/primary
  - Primary Hover: fill/primary-hover
  - Primary Disabled: fill/disabled
  - Secondary Default: surface/default와 border/default
  - Secondary Hover: bg/subtle
- 용법:
  - Primary: 신청·다음 등 주요 행동
  - Secondary: 카드의 "자세히" 등 보조 행동
  - 하단 주 행동은 xl을 부모 너비에 맞춰 사용
- 등록된 Loading 변형은 없다.

### Input

- 변형: State=default | focus | filled | caution | disabled
- BOOLEAN 속성:
  - errorMessage
  - 기본값: false
- 노출된 값·플레이스홀더 TEXT 속성: 없음
- 기본 너비: 358px
- field 높이: 58px
- field 반경: 0px
- field 세로 패딩: 12px
- 안내 메시지와 field 간격: 12px
- 상태:
  - default: border/default, 플레이스홀더 표현
  - focus: border/focus
  - filled: 입력값 표시
  - caution: border/error와 text/error, 오류 메시지 표시
  - disabled: bg/subtle과 text/on-disabled
- caution 기본 전체 높이: 90px
- 용법:
  - 신청 화면의 이름·휴대폰 번호 입력
  - 템플릿에서 이름은 filled, 휴대폰 번호는 focus
  - 필드 라벨은 템플릿의 별도 텍스트로 배치
  - 값과 메시지는 내부 텍스트 오버라이드로 변경
- 확인 사항:
  - caution의 메시지는 기본적으로 보이며 errorMessage 속성과 직접 연결되어 있지 않다.
  - 다른 변형에서는 메시지 표시가 errorMessage에 연결되어 있다.
  - 따라서 errorMessage 하나가 모든 상태에서 동일하게 동작한다고 가정하지 않는다.

### Checkbox

- 변형: State=default | active
- 별도 TEXT·BOOLEAN 속성: 없음
- 크기: 24×24px
- 용법:
  - 필수 개인정보 동의 등의 선택 상태 표시
  - 동의 문구는 외부 텍스트로 배치
  - active는 fill/primary로 선택 상태를 표시
- 템플릿에서는 개인정보 동의에 active를 사용한다.
- Disabled·indeterminate 변형은 없다.

### BottomCTA

- 변형: Layout=single | double | price
- TEXT 속성:
  - Amount
  - AmountLabel
- 기본값:
  - Amount: "월 85,000원"
  - AmountLabel: "월 납부 금액"
- 기본 너비: 390px
- 배경: bg/surface
- 용법:
  - single: 주 행동 버튼 1개
  - double: 보조 행동과 주 행동 버튼 2개
  - price: 금액 요약과 주 행동 버튼
- 템플릿:
  - 상세: price, "구독 신청하기"
  - 신청: single, "신청하기"
  - 완료: single, "요금제 더 보기"
- 버튼은 내부 Button 인스턴스로 구성된다.
- 버튼 라벨은 BottomCTA 자체 속성으로 노출되어 있지 않아 내부 Button의 Label을 변경한다.
- Amount·AmountLabel은 price 레이아웃의 금액 행에 사용한다.
- 고정 위치·스크롤·클릭 동작은 이 속성 정의에 포함되어 있지 않다.

### icon/arrowLeft

- 단일 컴포넌트
- 크기: 24×24px
- 노출된 속성·변형: 없음
- 용법: Header default의 뒤로가기 표시
- 실제 화살표 색: icon/default
- 클릭 영역 크기와 이동 동작은 별도 정의가 필요하다.

### icon/check

- 단일 컴포넌트
- 기본 크기: 24×24px
- 노출된 속성·변형: 없음
- 용법: 완료 표시 내부의 체크
- icon/doneMark 내부에서는 30×30px로 사용한다.

### icon/doneMark

- 단일 컴포넌트
- 크기: 64×64px
- 반경: 9999px
- 내부 구성: icon/check
- 노출된 속성·변형: 없음
- 용법: 신청 완료 화면의 성공 표시

### Logo

- 단일 컴포넌트
- 크기: 32×24px
- 내부 로고 색: brand/primary
- 노출된 속성·변형: 없음
- 용법: Header root의 브랜드 표시

### 공통 사용 기준

- 등록된 변형과 노출된 속성을 우선 사용한다.
- 노출되지 않은 텍스트는 내부 텍스트 오버라이드로 변경한다.
- 데이터 표시 요소는 같은 요금제·신청 데이터에서 값을 가져와 일관성을 유지한다.
- 컴포넌트의 시각적 상태와 실제 클릭·입력·선택 동작은 별개다.
- 로딩·빈 결과·서버 오류 전용 컴포넌트는 현재 Components 섹션에서 확인되지 않았다.
- 목록 필터, 단계 선택, 입력 검증, 뒤로가기, 신청 처리 동작은 구현 시 별도 정의한다.
