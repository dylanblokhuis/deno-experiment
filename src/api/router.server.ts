import { mergeRouters } from './trpc.server.ts';

import { fieldGroupRouter } from './routers/field-group.ts';
import { postRouter } from './routers/post.ts';
import { settingsRouter } from './routers/settings.ts';
import { Context } from '../lib.tsx';
import { userRouter } from './routers/user.ts';

export const appRouter = mergeRouters(fieldGroupRouter, postRouter, settingsRouter, userRouter);

export const appRouterCaller = (ctx: Context) => {
  const session = ctx.get("session")

  // console.log("session", session);

  return appRouter.createCaller({
    session: session
  });
}
export type AppRouter = typeof appRouter;