// this is just so a node_modules folder gets created with react in it
// why? https://github.com/denoland/deno/issues/16653
import type { } from "npm:react@18"
import type { } from "npm:react-dom@18"

import config from "./config.ts";
import { serve } from "https://deno.land/std@0.165.0/http/server.ts";
import { serveDir, serveFile } from "https://deno.land/std@0.165.0/http/file_server.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.14.51/mod.js";
import * as path from "https://deno.land/std@0.165.0/path/mod.ts";
import { Hono } from 'hono'
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { App, AppData, RouteModule, Context, ContextEnvironment } from "./lib.tsx";
import { appRouter } from "./api/router.server.ts";
import { handleRequest } from "./entry.server.tsx"
import routes from "./routes.tsx"
import { Admin, loader } from "./admin/layout/admin.tsx";
import { migrate } from "$db.server";

declare global {
  interface Window {
    routeModules: Record<string, RouteModule>
    appContext: App
  }
}

const app = new Hono<ContextEnvironment>()

for (const entry of routes) {
  if (entry.length === 2) {
    const [route, module] = entry;
    app.get(route, (c) => handler(c, module)).post(route, (c) => handler(c, module));
  }
  if (entry.length === 3) {
    const [route, middleware, module] = entry;
    for (const mw of Array.isArray(middleware) ? middleware : [middleware]) {
      app.use(route, mw);
    }
    app.get(route, (c) => handler(c, module)).post(route, (c) => handler(c, module));
  }
}

app.get("/trpc", (c) => {
  return fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req,
    router: appRouter
  })
})

/**
 * Until tailwindcss gets supported by Deno this is a workaround
 */
let lastMtime: Date | null;
app.get("/tailwind.css", async (c) => {
  try {
    const stat = await Deno.stat("./dist");

    if (stat.mtime?.getTime() !== lastMtime?.getTime()) {
      const p = Deno.run({
        cmd: ["tailwindcss", "-i", "./src/global.css", "--content", "./src/**/*.tsx", "-o", "./dist/tailwind.css"],
        stdout: "null",
        stderr: "null"
      });
      await p.status();
      lastMtime = stat.mtime;

    }
  } catch (error) {
    console.error(error)
  }

  return serveFile(c.req, "./dist/tailwind.css");
})

app.get("/dist/*", (c) => serveDir(c.req, {
  fsRoot: ".",
  quiet: true,
}));

async function bundle(moduleTree: ModuleTree): Promise<esbuild.Metafile> {
  // thanks to the remix.run team for building these plugins
  // https://github.dev/remix-run/remix/blob/2248669ed59fd716e267ea41df5d665d4781f4a9/packages/remix-dev/compiler/compileBrowser.ts#L78
  function emptyModulesPlugin(
    filter: RegExp
  ): esbuild.Plugin {
    return {
      name: "empty-modules",
      setup(build) {
        build.onResolve({ filter }, (args) => {
          return { path: args.path, namespace: "empty-module" };
        });

        build.onLoad({ filter: /.*/, namespace: "empty-module" }, () => {
          return {
            // Use an empty CommonJS module here instead of ESM to avoid "No
            // matching export" errors in esbuild for stuff that is imported
            // from this file.
            contents: "module.exports = {};",
            loader: "js",
          };
        });
      },
    };
  }

  function browserRouteModulesPlugin(
    suffixMatcher: RegExp
  ): esbuild.Plugin {
    return {
      name: "browser-route-modules",
      setup(build) {
        build.onResolve({ filter: suffixMatcher }, (args) => {
          return {
            path: args.path,
            namespace: "browser-route-module",
          };
        });

        build.onLoad(
          { filter: suffixMatcher, namespace: "browser-route-module" },
          (args) => {
            let theExports;
            const file = args.path.replace(suffixMatcher, "");
            const module = moduleTree.find((m) => m.modulePath === file);

            const browserSafeRouteExports: { [name: string]: boolean } = {
              default: true,
              Head: true,
            };

            try {
              if (!module) throw new Error("No module found");
              theExports = module?.exports.filter(ex => !!browserSafeRouteExports[ex]);
            } catch (error) {
              return {
                errors: [
                  {
                    text: error.message,
                    pluginName: "browser-route-module",
                  },
                ],
              };
            }

            let contents = "module.exports = {};";
            if (theExports.length !== 0) {
              const spec = `{ ${theExports.join(", ")} }`;
              contents = `export ${spec} from ${JSON.stringify(file)};`;
            }

            return {
              contents,
              resolveDir: path.join(Deno.cwd(), "./src"),
              loader: "js",
            };
          }
        );
      },
    };
  }

  const res = await esbuild.build({
    entryPoints: ["./entry.client.tsx", ...moduleTree.map(it => `${it.modulePath}?browser`)],
    platform: "browser",
    format: "esm",
    bundle: true,
    splitting: true,
    outdir: "../dist",
    minify: config.mode === "production",
    treeShaking: true,
    tsconfig: "../tsconfig.esbuild.json",
    absWorkingDir: path.join(Deno.cwd(), "src"),
    entryNames: "[dir]/[name]-[hash]",
    chunkNames: "_shared/[name]-[hash]",
    assetNames: "_assets/[name]-[hash]",
    // outdir: ".",
    // outfile: "",
    // write: false,
    metafile: true,
    incremental: false,
    plugins: [browserRouteModulesPlugin(/\?browser$/), emptyModulesPlugin(/\.server(\.[jt]sx?)?$/)],
  })

  return res.metafile;
}

export type ModuleTree = {
  loaderData: AppData,
  actionData: AppData,
  exports: string[],
  module: React.FC<{ children?: React.ReactNode }>,
  head?: React.FC
  modulePath: string
}[]

async function handler(ctx: Context, modulePaths: string | string[]) {
  const contextVariables: ContextEnvironment["Variables"] = {
    bodyClasses: [],
    admin: new Admin()
  }
  // @ts-expect-error - setting the default values to conform the interface
  ctx._map = contextVariables;

  const modulePath = Array.isArray(modulePaths) ? modulePaths : [modulePaths];
  let moduleTree: ModuleTree;

  try {
    moduleTree = await Promise.all(modulePath.map(async (modulePath) => {
      const module = await import(modulePath) as RouteModule;

      return {
        loaderData: module.loader ? await module.loader(ctx) : null,
        actionData: module.action && ctx.req.method === "POST" ? await module.action(ctx) : null,
        head: module.Head,
        exports: Object.keys(module),
        module: module.default,
        modulePath: modulePath
      }
    }));

    const metafile = await bundle(moduleTree);
    const files = Object.entries(metafile.outputs)
      .map(([name, file]) => ({
        name: name.replace("../", ""),
        input: Object.keys(file.inputs).at(-1)!
      }));

    const res = handleRequest({
      moduleTree,
      files,
      // @ts-expect-error - use private _map, otherwise it would require using getters 50x times.
      variables: ctx._map
    })

    return ctx.html('<!DOCTYPE html>' + res);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    // TODO: handle error page here
    throw error;
  }
}

await migrate();

await Promise.all([
  serve(app.fetch, { port: 3000 }),
  config.mode === "development" && serve(function (req: Request) {
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() != "websocket") {
      return new Response("request isn't trying to upgrade to websocket.");
    }
    const { response } = Deno.upgradeWebSocket(req);

    return response;
  }, { port: config.livereloadWsPort || 8002 })
]);
