import { Roles } from "../db/db.server.ts";
import { middleware } from "./trpc.server.ts";
import { Handler } from "$lib"

export const isAuthorised: Handler = (ctx) => {
  // ctx.header("x-message", "XD");
  // ctx.set()
}

export const roleMiddleware = (role: Roles) => middleware(async ({ next }) => {
  console.log("roleMiddleware", role);

  return await next()
})