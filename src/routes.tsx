import type { Module, Route } from './lib.tsx'
import { isAuthorised } from './api/middleware.ts'

const routes: Route[] = [
  ["/admin", isAuthorised, ["./admin/layout/admin.tsx", "./admin/routes/index.tsx"]],
  ["/admin/posts", isAuthorised, ["./admin/layout/admin.tsx", "./admin/routes/posts/index.tsx"]],
  ["/admin/posts/edit", isAuthorised, ["./admin/layout/admin.tsx", "./admin/routes/posts/edit.tsx"]],
  ["/admin/field-groups", isAuthorised, ["./admin/layout/admin.tsx", "./admin/routes/field-groups/index.tsx"]],
  ["/admin/field-groups/edit", isAuthorised, ["./admin/layout/admin.tsx", "./admin/routes/field-groups/edit.tsx"]],
  ["/admin/field-groups/delete", isAuthorised, ["./admin/routes/field-groups/delete.ts"]],
  ["/admin/users", isAuthorised, ["./admin/layout/admin.tsx", "./admin/routes/users/index.tsx"]],
  ["/admin/users/edit", isAuthorised, ["./admin/layout/admin.tsx", "./admin/routes/users/edit.tsx"]],
]

export const runtimeRoutes: Map<Route[0], [number, Module]> = new Map();
export default routes;