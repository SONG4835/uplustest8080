import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, Navigate, RouterProvider } from "react-router"
import { routes } from "./screens/routes"
import "./index.css"

// 진입 지점: 알 수 없는 경로는 요금제 목록으로 (screens.md 라우트 수에는 포함하지 않음)
const router = createBrowserRouter([...routes, { path: "*", element: <Navigate to="/plans" replace /> }])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
