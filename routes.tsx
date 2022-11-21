import { isAuthorised } from './app/api/middleware.ts'
import { MiddlewareHandler } from './app/lib.tsx'
type Middleware = MiddlewareHandler | MiddlewareHandler[]
type Module = string | string[]
type Route = [string, Module] | [string, Middleware, Module]

const routes: Route[] = [
  ["/", "./app/routes/home.tsx"],
  ["/admin", isAuthorised, ["./app/layout/admin.tsx", "./app/routes/admin.tsx"]],
  ["/admin/*", "./app/routes/admin.tsx"],
]

export default routes;