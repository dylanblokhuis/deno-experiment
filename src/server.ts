// deno-lint-ignore-file no-explicit-any
import { RegExpRouter, SmartRouter, StaticRouter, TrieRouter } from 'https://deno.land/x/hono@v2.5.2/mod.ts'
import { getPathFromURL } from 'https://deno.land/x/hono@v2.5.2/utils/url.ts'
import { TRPCError } from '@trpc/server'
import { getHTTPStatusCodeFromError } from "@trpc/server/http"
type ContextVariables = Record<string, any>
type HandlerReturn = Response | void | undefined
export type Handler<C extends ContextVariables = ContextVariables, T = Context<C>> = (ctx: T) => HandlerReturn | Promise<HandlerReturn>

export class Context<V extends ContextVariables = ContextVariables> {
  request: Request
  variables: Record<keyof V, any> = {} as V
  headers: Headers = new Headers()

  constructor(req: Request) {
    this.request = req
  }

  get<Key extends keyof V>(key: Key): V[Key] {
    return this.variables[key]
  }
  set<Key extends keyof V>(key: Key, value: V[Key]) {
    this.variables[key] = value
  }
  delete<Key extends keyof V>(key: Key) {
    delete this.variables[key]
  }
}

export class Server<V extends ContextVariables> {
  router = new SmartRouter<Handler<V>>({
    routers: [new StaticRouter(), new RegExpRouter(), new TrieRouter()],
  })

  get(path: string, handler: Handler<V>) {
    this.router.add("GET", path, handler)
  }

  post(path: string, handler: Handler<V>) {
    this.router.add("POST", path, handler)
  }

  use(path: string, handler: Handler<V>) {
    this.router.add("ALL", path, handler)
  }

  async handleRequest(request: Request): Promise<Response> {
    const path = getPathFromURL(request.url, true)
    const route = this.router.match(request.method, path)

    if (!route || route?.handlers.length === 0) return new Promise((resolve) => resolve(new Response("Not Found", { status: 404 })))

    const ctx = new Context<V>(request);
    for (const routeHandler of route.handlers) {
      try {
        const res = await routeHandler(ctx)
        if (res) return res
      } catch (error) {
        if (error instanceof Response) return error
        if (error instanceof TRPCError) return new Response(error.message, { status: getHTTPStatusCodeFromError(error) });
        console.error("Uncaught error inside handler occured", error)
        return new Response(error.message, { status: 500 })
      }
    }

    return new Response("Not Found", { status: 404 })
  }
}