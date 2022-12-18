import { z } from "zod"
import { router, procedure } from '../trpc.server.ts';
import db from "$db.server";

export const postRouter = router({
  getPostType: procedure
    .input(
      z.object({
        slug: z.string(),
      })
    ).query(async ({ input }) => {
      const postType = await db.selectFrom("post_type").selectAll().where("slug", '=', input.slug).executeTakeFirst();
      return postType;
    }),
  getPostTypes: procedure
    .query(async () => {
      const postTypes = await db.selectFrom("post_type").selectAll().execute();
      return postTypes;
    }),
  getPosts: procedure
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
});