import { z } from "zod"
import { router, procedure } from '../trpc.server.ts';
import db from "$db.server";
import { runtimeRoutes } from '../../routes.tsx';
// import * as path from "https://deno.land/std@0.165.0/path/mod.ts";
// import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";

export const userRouter = router({
  createUser: procedure.role("admin")
    .input(z.object({
      name: z.string(),
      email: z.string(),
      password: z.string(),
      role: z.enum(["admin", "editor", "subscriber"]),
    }))
    .mutation(async ({ input }) => {
      const user = await db.insertInto("user")
        .values({
          name: input.name,
          email: input.email,
          password: input.password,
          role: input.role,
        })
        .execute();
    })
})