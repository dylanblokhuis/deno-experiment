import type { Route } from './app/lib.tsx'
import { isAuthorised } from './app/api/middleware.ts'

const routes: Route[] = [
  ["/", "./app/routes/home.tsx"],
  ["/admin", isAuthorised, ["./app/layout/admin.tsx", "./app/routes/admin/index.tsx"]],
  ["/admin/posts", isAuthorised, ["./app/layout/admin.tsx", "./app/routes/admin/posts.tsx"]],
  ["/admin/field-groups", isAuthorised, ["./app/layout/admin.tsx", "./app/routes/admin/field-groups/index.tsx"]],
  ["/admin/field-groups/edit", isAuthorised, ["./app/layout/admin.tsx", "./app/routes/admin/field-groups/edit.tsx"]],
]

export default routes;