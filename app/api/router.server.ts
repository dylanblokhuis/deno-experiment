import { publicProcedure, router } from './trpc.ts';
import { z } from "zod"

export const appRouter = router({
  greeting: publicProcedure
    .input(
      z
        .object({
          text: z.string(),
        })
    ).query((input) => `hello tRPC v10! ${input.input.text}`),
});

export type AppRouter = typeof appRouter;