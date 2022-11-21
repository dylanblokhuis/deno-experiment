import type { Route } from './app/lib.tsx'
import { isAuthorised } from './app/api/middleware.ts'

const routes: Route[] = [
  ["/", "./app/routes/home.tsx"],
  ["/admin", isAuthorised, ["./app/layout/admin.tsx", "./app/routes/admin.tsx"]],
  ["/admin/*", "./app/routes/admin.tsx"],
]

export default routes;