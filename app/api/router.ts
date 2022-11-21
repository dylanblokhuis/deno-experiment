import * as trpc from '@trpc/server';
import z from 'zod';

type Context = {};

export const appRouter = trpc
  .router<Context>()

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;