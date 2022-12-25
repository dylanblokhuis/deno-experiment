// import { z } from "zod"
import { procedure, router } from "../trpc.server.ts";
import { generateRuntimeRoutes } from "../../lib/server.ts";
// import * as path from "https://deno.land/std@0.165.0/path/mod.ts";

export const settingsRouter = router({
  generateRuntimeRoutes: procedure.role("admin")
    .mutation(async () => {
      await generateRuntimeRoutes();
    }),
});
