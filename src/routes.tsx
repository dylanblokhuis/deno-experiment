import type { Module, Route } from './lib.tsx'
import { isAuthorised } from './api/middleware.ts'

const routes: Route[] = [
  ["/admin", isAuthorised("subscriber"), ["./admin/layout/admin.tsx", "./admin/routes/index.tsx"]],
  ["/admin/insufficient-permissions", isAuthorised("editor"), ["./admin/layout/admin.tsx", "./admin/routes/insufficient-permissions.tsx"]],
  ["/admin/posts", isAuthorised("editor"), ["./admin/layout/admin.tsx", "./admin/routes/posts/index.tsx"]],
  ["/admin/posts/edit", isAuthorised("editor"), ["./admin/layout/admin.tsx", "./admin/routes/posts/edit.tsx"]],
  ["/admin/field-groups", isAuthorised("editor"), ["./admin/layout/admin.tsx", "./admin/routes/field-groups/index.tsx"]],
  ["/admin/field-groups/edit", isAuthorised("editor"), ["./admin/layout/admin.tsx", "./admin/routes/field-groups/edit.tsx"]],
  ["/admin/field-groups/delete", isAuthorised("editor"), ["./admin/routes/field-groups/delete.ts"]],
  ["/admin/users", isAuthorised("admin"), ["./admin/layout/admin.tsx", "./admin/routes/users/index.tsx"]],
  ["/admin/users/edit", isAuthorised("admin"), ["./admin/layout/admin.tsx", "./admin/routes/users/edit.tsx"]],
  ["/auth/login", ["./auth/layout.tsx", "./auth/login.tsx"]],
]

export const runtimeRoutes: Map<Route[0], [number, Module]> = new Map();
export default routes;