import { Context } from "$lib";
import { redirect } from "$lib/server.ts";
import { appRouter } from "../../../api/router.server.ts";

export async function action(ctx: Context) {
  const id = new URL(ctx.req.url).searchParams.get("id");

  if (!id) {
    return ctx.text("No id provided", 400);
  }

  await appRouter.createCaller({}).deleteFieldGroup({
    id: parseInt(id)
  })

  return redirect("/admin/field-groups");
}