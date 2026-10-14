// 파일 개요: 앱이 처음 시작되는 "출발점(진입 파일)"이다.
// index.html 안의 빈 상자(<div id="root">)에 우리가 만든 화면(App)을 끼워 넣어 보여준다.
// 비유: 빈 액자(root)에 그림(App)을 걸어 주는 역할.
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // 실제 화면 전체를 담은 최상위 컴포넌트
import './index.css' // 전체 화면에 적용되는 스타일(CSS)

// 1) document.getElementById('root')로 index.html의 빈 상자를 찾는다.
//    끝의 '!'는 "이 상자는 반드시 있다"고 TypeScript에게 알려주는 표시다.
// 2) createRoot(...)로 그 상자를 React가 관리하도록 연결하고, render(...)로 화면을 그린다.
ReactDOM.createRoot(document.getElementById('root')!).render(
  // StrictMode: 개발 중에만 작동하는 검사 도구. 실수하기 쉬운 코드를 미리 경고해 준다.
  // (실제 사용자 화면에는 아무 영향이 없다.)
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
