import { initTRPC } from "@trpc/server";
import { Roles } from "../db/db.server.ts";
import { Context } from "$lib";
import { roleMiddleware } from "./middleware.ts";

const t = initTRPC.context<{
  ctx: Context;
}>().create();

export const middleware = t.middleware;
export const router = t.router;
export const procedure = {
  public: t.procedure,
  role: (role: Roles) => t.procedure.use(roleMiddleware(role)),
};
export const mergeRouters = t.mergeRouters;
