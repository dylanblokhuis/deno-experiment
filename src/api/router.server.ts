import { z } from "zod"
import { initTRPC } from '@trpc/server';
import db from "../db/db.server.ts";

const t = initTRPC.create();

export const appRouter = t.router({
  getFieldTypes: t.procedure
    .output(z.array(z.object({
      id: z.number(),
      name: z.string(),
    })))
    .query(async () => {
      const data = await db.selectFrom("field_type").selectAll().execute();
      return data;
    }),

  getFieldGroups: t.procedure
    .query(async () => {
      const groups = await db.selectFrom("field_group").selectAll().execute();
      return groups;
    }),
  getFieldGroup: t.procedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .output(
      z
        .object({
          id: z.number(),
          name: z.string(),
          fields: z.array(z.object({
            name: z.string(),
            slug: z.string(),
            type_id: z.number(),
          }))
        }).nullable()
    )
    .query(async ({ input }) => {
      const fieldGroup = await db.selectFrom("field_group")
        .selectAll()
        .where("field_group.id", '=', input.id)
        .executeTakeFirst();

      if (!fieldGroup) return null;

      const fields = await db.selectFrom("field_group")
        .selectAll()
        .innerJoin("field", "field.field_group_id", "field_group.id")
        .selectAll()
        .where("field_group.id", '=', input.id)
        .execute();

      return {
        id: fieldGroup.id,
        name: fieldGroup.name,
        fields: fields.map((field) => ({
          name: field.name,
          slug: field.slug,
          type_id: field.type_id,
        })),
      };
    }),
  createOrUpdateFieldGroup: t.procedure
    .input(
      z
        .object({
          id: z.number().optional(),
          name: z.string(),
          fields: z.array(z.object({
            id: z.number().optional(),
            name: z.string(),
            slug: z.string(),
            type_id: z.number(),
          }))
        })
    ).mutation(async ({ input }) => {
      let id = input.id;

      if (id) {
        await db.updateTable("field_group").set({
          name: input.name,
        }).where("field_group.id", "=", id).executeTakeFirstOrThrow();

        for (const field of input.fields) {
          if (field.id) {
            await db.updateTable("field").set(field).execute();
          } else {
            await db.insertInto("field").values({
              ...field,
              field_group_id: id,
            }).execute();
          }
        }
      } else {
        const res = await db.insertInto("field_group").values({
          name: input.name,
        }).returning("id").executeTakeFirstOrThrow();

        id = res.id;

        for (const field of input.fields) {
          await db.insertInto("field").values({
            ...field,
            field_group_id: id,
          }).execute();
        }
      }

      return { id };
    }),
});

export type AppRouter = typeof appRouter;