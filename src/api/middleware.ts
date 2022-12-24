import db, { Roles } from "../db/db.server.ts";
import { middleware } from "./trpc.server.ts";
import { Handler } from "$lib"
import { commitSession, getSession } from "../lib/session.server.ts";
import { redirect } from "../lib/server.ts";
import { TRPCError } from "@trpc/server";

export const isAuthorised: (role: Roles) => Handler = (role: Roles) => async (ctx) => {
  const session = await getSession(ctx.request.headers);
  const id = session.get("userId") as number | undefined;
  if (!id) {
    throw redirect("/auth/login")
  }

  const user = await db.selectFrom("user").selectAll().where("id", "=", id).executeTakeFirst();
  if (!user) {
    session.delete("userId");
    throw redirect("/auth/login", {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    })
  }

  if (role === "subscriber" && (user.role === "subscriber" || user.role === "editor" || user.role === "admin")) {
    return;
  }

  if (role === "editor" && (user.role === "editor" || user.role === "admin")) {
    return;
  }

  if (role === "admin" && user.role === "admin") {
    return;
  }

  throw redirect("/admin/insufficient-permissions")
}

export const roleMiddleware = (role: Roles) => middleware(async ({ ctx, next }) => {
  try {
    await isAuthorised(role)(ctx.ctx);
    return await next()
  } catch (error) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to perform this action",
    })
  }
})