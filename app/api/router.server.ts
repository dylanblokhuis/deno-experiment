import { z } from "zod"
import { initTRPC } from '@trpc/server';
import db from "../db/db.server.ts";

const t = initTRPC.create();

export const appRouter = t.router({
  getFieldTypes: t.procedure.input(z.object({})).query(async () => {
    const data = await db.selectFrom("field_type").selectAll().execute();
    return data;
  }),
  createFieldGroup: t.procedure
    .input(
      z
        .object({
          name: z.string(),
          fields: z.array(z.object({
            name: z.string(),
            slug: z.string(),
            type_id: z.number(),
            field_group_id: z.number(),
          }))
        })
    ).query(async ({ input }) => {
      const { id } = await db.insertInto("field_group").values({
        name: input.name,
      }).returning("id").executeTakeFirstOrThrow();

      for (const field of input.fields) {
        await db.insertInto("field").values({
          ...field,
          field_group_id: id,
        }).execute();
      }
    }),
});

export type AppRouter = typeof appRouter;