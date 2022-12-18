import { mergeRouters } from './trpc.server.ts';

import { fieldGroupRouter } from './routers/field-group.ts';
import { postRouter } from './routers/post.ts';

export const appRouter = mergeRouters(fieldGroupRouter, postRouter);

export const appRouterCaller = appRouter.createCaller({});
export type AppRouter = typeof appRouter;