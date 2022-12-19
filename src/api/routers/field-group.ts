import { z } from "zod"
import { router, procedure } from '../trpc.server.ts';
import db from "$db.server";

export const fieldGroupRouter = router({
  getFieldTypes: procedure
    .output(z.array(z.object({
      id: z.number(),
      name: z.string(),
    })))
    .query(async () => {
      const data = await db.selectFrom("field_type").selectAll().execute();
      return data;
    }),

  getFieldGroups: procedure
    .input(
      z.object({
        postTypeId: z.number().optional()
      }).optional()
    )
    .output(
      z
        .array(z.object({
          id: z.number(),
          name: z.string(),
          connectedPostTypes: z.array(z.number()),
          fields: z.array(z.object({
            id: z.number(),
            name: z.string(),
            slug: z.string(),
            type_id: z.number(),
          }))
        }))
    )
    .query(async ({ input }) => {
      let groups;
      let connectedPostTypeIds: number[] = [];
      if (input?.postTypeId) {
        const connectedPostTypes = await db.selectFrom("field_group_on_post_type")
          .selectAll()
          .where("post_type_id", '=', input.postTypeId)
          .execute();
        connectedPostTypeIds = connectedPostTypes.map(it => it.post_type_id);
        groups = await db.selectFrom("field_group").selectAll().where('id', 'in', connectedPostTypes.map(it => it.field_group_id)).execute();
      } else {
        groups = await db.selectFrom("field_group").selectAll().execute();
      }

      const fields = await db.selectFrom("field").selectAll().where('field_group_id', 'in', groups.map(it => it.id)).execute();
      return groups.map(group => {
        return {
          id: group.id,
          name: group.name,
          connectedPostTypes: connectedPostTypeIds,
          fields: fields.filter(it => it.field_group_id === group.id)
        }
      });
    }),
  getFieldGroup: procedure
    .input(
      z.object({
        id: z.number()
      })
    )
    .output(
      z
        .object({
          id: z.number(),
          name: z.string(),
          connectedPostTypes: z.array(z.number()),
          fields: z.array(z.object({
            id: z.number(),
            name: z.string(),
            slug: z.string(),
            type_id: z.number(),
          }))
        }).nullable()
    )
    .query(async ({ input }) => {
      const fieldGroupId = input.id;

      const fieldGroup = await db.selectFrom("field_group")
        .selectAll()
        .where("field_group.id", '=', fieldGroupId)
        .executeTakeFirst();

      if (!fieldGroup) return null;

      const fields = await db.selectFrom("field")
        .selectAll()
        .where("field_group_id", '=', fieldGroupId)
        .execute();

      const connectedPostTypes = await db.selectFrom("field_group_on_post_type").where("field_group_id", "=", fieldGroupId).selectAll().execute();

      return {
        id: fieldGroup.id,
        name: fieldGroup.name,
        connectedPostTypes: connectedPostTypes.map((c) => c.post_type_id),
        fields: fields.map((field) => ({
          id: field.id,
          name: field.name,
          slug: field.slug,
          type_id: field.type_id,
        })),
      };
    }),
  createOrUpdateFieldGroup: procedure
    .input(
      z
        .object({
          id: z.number().optional(),
          name: z.string(),
          postTypes: z.array(z.number()),
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
            await db.updateTable("field").where("id", "=", field.id).set(field).execute();
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

      await db.deleteFrom("field_group_on_post_type")
        .where("field_group_id", "=", id)
        .executeTakeFirst();

      for (const postTypeId of input.postTypes) {
        await db.insertInto("field_group_on_post_type").values({
          field_group_id: id,
          post_type_id: postTypeId,
        }).executeTakeFirst()
      }

      return { id };
    }),
  deleteFieldGroup: procedure
    .input(
      z.object({
        id: z.number(),
      })
    ).mutation(async ({ input }) => {
      const res = await db.deleteFrom("field_group").where("id", "=", input.id).executeTakeFirst();
      return res;
    }),
});