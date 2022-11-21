// because deno cant find the types
// @deno-types="https://esm.sh/v99/@trpc/server@10.0.0/dist/index.d.ts"
import { initTRPC } from '@trpc/server';

const t = initTRPC.create();
export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;