import { MiddlewareHandler } from "../lib.tsx";

export const isAuthorised: MiddlewareHandler = async (ctx, next) => {
  ctx.header("x-message", "XD");

  await next();
}
