import { mergeRouters } from './trpc.server.ts';

import { fieldGroupRouter } from './routers/field-group.ts';
import { postRouter } from './routers/post.ts';
import { settingsRouter } from './routers/settings.ts';

export const appRouter = mergeRouters(fieldGroupRouter, postRouter, settingsRouter);

export const appRouterCaller = appRouter.createCaller({});
export type AppRouter = typeof appRouter;