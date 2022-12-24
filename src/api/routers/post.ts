import { z } from "zod"
import { router, procedure } from '../trpc.server.ts';
import db from "$db.server";
import { titleToSlug } from "$lib/utils/slugify.ts";
import { generateRuntimeRoutes } from "../../lib/server.ts";

export const postRouter = router({
  getPostType: procedure.public
    .input(
      z.object({
        slug: z.string(),
      })
    ).query(async ({ input }) => {
      const postType = await db.selectFrom("post_type").selectAll().where("slug", '=', input.slug).executeTakeFirst();
      return postType;
    }),
  getPostTypes: procedure.public
    .query(async () => {
      const postTypes = await db.selectFrom("post_type").selectAll().execute();
      return postTypes;
    }),
  getPosts: procedure.public
    .input(
      z.object({
        postType: z.string().or(z.number()),
      })
    )
    .query(async ({ input }) => {
      let postTypeId;
      if (typeof input.postType === "string") {
        const postType = await db.selectFrom("post_type").select('id').where("slug", '=', input.postType).executeTakeFirst();
        if (!postType) throw new Error("Post type not found");
        postTypeId = postType.id;
      } else {
        postTypeId = input.postType as number;
      }

      return await db.selectFrom("post").where("post_type_id", "=", postTypeId).selectAll().execute();
    }),
  getPost: procedure.public
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ input }) => {
      const post = await db.selectFrom("post").selectAll().where("id", '=', input.id).executeTakeFirst();
      if (!post) return undefined

      const fields = await db.selectFrom("post_field").selectAll().where("post_id", '=', input.id).execute();
      return {
        ...post,
        fields: fields.map((field) => ({
          id: field.field_id,
          value: field.value,
        })),
      };
    }),
  createOrUpdatePost: procedure.role("editor").input(
    z.object({
      id: z.number().optional(),
      title: z.string(),
      slug: z.string().optional(),
      postTypeId: z.number(),
      status: z.enum(["draft", "published"]),
      fields: z.array(z.object({
        id: z.number(),
        value: z.string(),
      }))
    })
  ).mutation(async ({ input, ctx }) => {
    let postId = input.id;

    const slug = titleToSlug(input.slug || input.title);
    const postExistsWithSlug = await db.selectFrom("post")
      .where('slug', '=', slug)
      .if(postId !== undefined, (query) => query.where('id', '!=', postId as number))
      .select(["id", "slug"])
      .executeTakeFirst();

    if (postExistsWithSlug) throw new Error("Post with this slug already exists")

    if (postId) {
      await db.updateTable("post").set({
        title: input.title,
        slug: input.slug ? slug : undefined,
        status: input.status,
        post_type_id: input.postTypeId,
      }).where("id", "=", postId).execute();
    } else {
      const post = await db.insertInto("post").values({
        title: input.title,
        slug: slug,
        status: input.status,
        post_type_id: input.postTypeId,
      }).returning("id").executeTakeFirst();
      if (!post) throw new Error("Post not created");
      postId = post.id;
    }

    for (const field of input.fields) {
      const exists = await db.selectFrom("post_field").selectAll().where("post_id", "=", postId).where("field_id", "=", field.id).executeTakeFirst();

      if (exists) {
        await db.updateTable("post_field").set({
          value: field.value,
        }).where("post_id", "=", postId).where("field_id", "=", field.id).execute();
        continue;
      }

      await db.insertInto("post_field").values({
        post_id: postId,
        field_id: field.id,
        value: field.value,
      }).execute();
    }

    // delete fields that arent in the form
    await db.deleteFrom("post_field").where("post_id", "=", postId).where("field_id", "not in", input.fields.map((field) => field.id)).execute();
    await generateRuntimeRoutes();
    return postId;
  })
});