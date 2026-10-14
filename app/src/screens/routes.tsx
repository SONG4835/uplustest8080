import type { RouteObject } from "react-router"
import { PlansPage } from "./PlansPage"
import { PlanDetailPage } from "./PlanDetailPage"
import { ApplyPage } from "./ApplyPage"
import { CompletePage } from "./CompletePage"

export const routes: RouteObject[] = [
  { path: "/plans", element: <PlansPage /> },
  { path: "/plans/:id", element: <PlanDetailPage /> },
  { path: "/apply", element: <ApplyPage /> },
  { path: "/complete", element: <CompletePage /> },
]
