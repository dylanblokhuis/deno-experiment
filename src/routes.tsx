import type { Route } from './lib.tsx'
import { isAuthorised } from './api/middleware.ts'

const routes: Route[] = [
  ["/admin", isAuthorised, ["./admin/layout/admin.tsx", "./admin/routes/index.tsx"]],
  ["/admin/posts", isAuthorised, ["./admin/layout/admin.tsx", "./admin/routes/posts.tsx"]],
  ["/admin/field-groups", isAuthorised, ["./admin/layout/admin.tsx", "./admin/routes/field-groups/index.tsx"]],
  ["/admin/field-groups/edit", isAuthorised, ["./admin/layout/admin.tsx", "./admin/routes/field-groups/edit.tsx"]],
]

export default routes;