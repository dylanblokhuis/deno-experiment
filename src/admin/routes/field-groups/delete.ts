import { Context } from "$lib";
import { json, redirect } from "$lib/server.ts";
import { appRouter } from "../../../api/router.server.ts";

export async function action(ctx: Context) {
  const id = new URL(ctx.request.url).searchParams.get("id");

  if (!id) {
    return json("No id provided", {
      status: 400
    });
  }

  await appRouter.createCaller({}).deleteFieldGroup({
    id: parseInt(id)
  })

  return redirect("/admin/field-groups");
}