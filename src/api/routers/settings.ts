// import { z } from "zod"
import { router, procedure } from '../trpc.server.ts';
import db from "$db.server";
import { runtimeRoutes } from '../../routes.tsx';
// import * as path from "https://deno.land/std@0.165.0/path/mod.ts";

export const settingsRouter = router({
  generateRuntimeRoutes: procedure
    .mutation(async () => {
      const posts = await db
        .selectFrom("post")
        .innerJoin("post_type", "post_type.id", "post_type_id")
        .select(["post.id", "post.slug", "post_type.path_prefix", "post_type.slug as post_type_slug"])
        .execute();

      runtimeRoutes.clear();
      for (const post of posts) {
        const route = post.path_prefix ? `${post.path_prefix}/${post.slug}` : `/${post.slug}`;
        runtimeRoutes.set(route, [post.id, `../templates/${post.post_type_slug}.tsx`]);
      }
    })
});