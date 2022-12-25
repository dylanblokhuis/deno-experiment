// this is just so a node_modules folder gets created with react in it
// why? https://github.com/denoland/deno/issues/16653
import type { } from "npm:react@18";
import type { } from "npm:react-dom@18";

import config from "./config.ts";
import { serve } from "https://deno.land/std@0.165.0/http/server.ts";
import {
  serveDir,
  serveFile,
} from "https://deno.land/std@0.165.0/http/file_server.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.16.10/mod.js";
import * as path from "https://deno.land/std@0.165.0/path/mod.ts";
import {
  App,
  AppData,
  Context,
  ContextVariables,
  Module,
  RouteModule,
} from "./lib.tsx";
import {
  generateRuntimeRoutes,
  headersToObject,
  Post,
  redirect,
} from "$lib/server.ts";
import { handleRequest } from "./entry.server.tsx";
import routes, { runtimeRoutes } from "./routes.tsx";
import { Admin } from "./admin/layout/admin.tsx";
import { migrate } from "$db.server";
import { Server } from "./server.ts";

declare global {
  interface Window {
    routeModules: Record<string, RouteModule>;
    appContext: App;
  }
}

const app = new Server<ContextVariables>();

for (const entry of routes) {
  if (entry.length === 2) {
    const [route, module] = entry;
    app.get(route, (c) => handler(c, module));
    app.post(route, (c) => handler(c, module));
  }
  if (entry.length === 3) {
    const [route, middleware, module] = entry;
    for (
      const mw of Array.isArray(middleware) ? middleware : [middleware]
    ) {
      app.use(route, mw);
    }
    app.get(route, (c) => handler(c, module));
    app.post(route, (c) => handler(c, module));
  }
}

// app.get("/trpc", (c) => {
//   function contextHandler({ req }: FetchCreateContextFnOptions) {
//     console.log(req.url);
//     return { req }
//   }

//   return fetchRequestHandler({
//     endpoint: "/trpc",
//     req: c.req,
//     router: appRouter,
//     createContext: contextHandler,
//   })
// })

/**
 * Until tailwindcss gets supported by Deno this is a workaround
 */
let lastMtime: Date | null;
app.get("/tailwind.css", async (c) => {
  try {
    const stat = await Deno.stat("./dist");

    if (stat.mtime?.getTime() !== lastMtime?.getTime()) {
      const p = Deno.run({
        cmd: [
          "tailwindcss",
          "-i",
          "./src/global.css",
          "--content",
          "./src/**/*.tsx",
          "-o",
          "./dist/tailwind.css",
        ],
        stdout: "null",
        stderr: "null",
      });
      await p.status();
      lastMtime = stat.mtime;
    }
  } catch (error) {
    console.error(error);
  }

  // TODO: cache in prod
  return serveFile(c.request, "./dist/tailwind.css");
});

app.get("/dist/*", (c) =>
  serveDir(c.request, {
    fsRoot: ".",
    quiet: true,
  }));

// TODO: add service worker?
app.get("/sw.js", () => new Response(null, { status: 404 }));

app.get("*", async (ctx) => {
  if (runtimeRoutes.size === 0) {
    await generateRuntimeRoutes();
  }

  const url = new URL(ctx.request.url);
  for (const [route, [postId, module]] of runtimeRoutes) {
    if (url.pathname === route) {
      return redirect(route + "/");
    } else if (url.pathname === route + "/") {
      ctx.set("post", new Post(ctx, postId));
      return handler(ctx, module as Module);
    }
  }
});

async function bundle(moduleTree: ModuleTree): Promise<esbuild.Metafile> {
  // thanks to the remix.run team for building these plugins
  // https://github.dev/remix-run/remix/blob/2248669ed59fd716e267ea41df5d665d4781f4a9/packages/remix-dev/compiler/compileBrowser.ts#L78
  function emptyModulesPlugin(
    filter: RegExp,
  ): esbuild.Plugin {
    return {
      name: "empty-modules",
      setup(build) {
        build.onResolve({ filter }, (args) => {
          return { path: args.path, namespace: "empty-module" };
        });

        build.onLoad(
          { filter: /.*/, namespace: "empty-module" },
          () => {
            return {
              // Use an empty CommonJS module here instead of ESM to avoid "No
              // matching export" errors in esbuild for stuff that is imported
              // from this file.
              contents: "module.exports = {};",
              loader: "js",
            };
          },
        );
      },
    };
  }

  function browserRouteModulesPlugin(
    suffixMatcher: RegExp,
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
          {
            filter: suffixMatcher,
            namespace: "browser-route-module",
          },
          (args) => {
            let theExports;
            const file = args.path.replace(suffixMatcher, "");
            const module = moduleTree.find((m) => m.modulePath === file);

            const browserSafeRouteExports: {
              [name: string]: boolean;
            } = {
              default: true,
              Head: true,
            };

            try {
              if (!module) throw new Error("No module found");
              theExports = module?.exports.filter((ex) =>
                !!browserSafeRouteExports[ex]
              );
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
          },
        );
      },
    };
  }

  const res = await esbuild.build({
    entryPoints: [
      "./entry.client.tsx",
      ...moduleTree.map((it) => `${it.modulePath}?browser`),
    ],
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
    plugins: [
      browserRouteModulesPlugin(/\?browser$/),
      emptyModulesPlugin(/\.server(\.[jt]sx?)?$/),
    ],
  });

  return res.metafile;
}

export type ModuleTree = {
  loaderData: AppData;
  actionData: AppData;
  exports: string[];
  module?: React.FC<{ children?: React.ReactNode }>;
  head?: React.FC;
  modulePath: string;
}[];

async function handler(ctx: Context, modulePaths: string | string[]) {
  const url = new URL(ctx.request.url);
  ctx.set("bodyClasses", []);
  ctx.set(
    "admin",
    url.pathname.startsWith("/admin") ? new Admin() : undefined,
  );

  const modulePath = Array.isArray(modulePaths) ? modulePaths : [modulePaths];
  let moduleTree: ModuleTree;

  try {
    moduleTree = await Promise.all(modulePath.map(async (modulePath) => {
      const module = await import(modulePath) as RouteModule;
      if (!module.default) {
        if (module.action && ctx.request.method === "POST") {
          throw await module.action(ctx);
        }
        if (module.loader) throw await module.loader(ctx);
        throw new Error("No modules found inside the route");
      }

      async function extract(
        callback: (ctx: Context) => Promise<unknown>,
      ) {
        let data = await callback(ctx);

        /**
         * Response class thrown, so we handle the cases where we need to redirect or set cookies
         */
        if (data instanceof Response) {
          if (data.headers.has("location")) {
            throw data;
          }

          if (
            data.headers.has("set-cookie") &&
            ctx.request.method === "POST"
          ) {
            // because the loader following would need the cookie already set, we're simulating the set-cookie behavior on the server.
            ctx.request = new Request(ctx.request.url, {
              ...ctx.request,
              headers: new Headers({
                ...headersToObject(ctx.request.headers),
                "cookie": data.headers.get("set-cookie")!,
              }),
            });
          } else if (data.headers.has("set-cookie")) {
            ctx.headers.set(
              "set-cookie",
              data.headers.get("set-cookie")!,
            );
          }

          data = await data.json();
        }

        return data;
      }

      const actionData = module.action && ctx.request.method === "POST"
        ? await extract(module.action)
        : undefined;
      const loaderData = module.loader
        ? await extract(module.loader)
        : undefined;

      return {
        actionData,
        loaderData,
        head: module.Head,
        exports: Object.keys(module),
        module: module.default,
        modulePath: modulePath,
      };
    }));

    const metafile = await bundle(moduleTree);
    const files = Object.entries(metafile.outputs)
      .map(([name, file]) => ({
        name: name.replace("../", ""),
        input: Object.keys(file.inputs).at(-1)!,
      }));

    ctx.delete("post");
    const res = handleRequest({
      moduleTree,
      files,
      variables: ctx.variables,
    });

    return new Response("<!DOCTYPE html>" + res, {
      status: 200,
      headers: {
        ...headersToObject(ctx.headers),
        "content-type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      return new Response(error.body, {
        status: error.status,
        headers: {
          ...headersToObject(error.headers),
          ...headersToObject(ctx.headers),
        },
      });
    }

    // TODO: handle error page here
    throw error;
  }
}

await migrate();

await Promise.all([
  serve((req) => app.handleRequest(req), { port: 3000 }),
  config.mode === "development" && serve(function (req: Request) {
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() != "websocket") {
      return new Response(
        "request isn't trying to upgrade to websocket.",
      );
    }
    const { response } = Deno.upgradeWebSocket(req);

    return response;
  }, { port: config.livereloadWsPort || 8002 }),
]);
