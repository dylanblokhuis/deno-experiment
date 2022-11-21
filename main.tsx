// this is just so a node_modules folder gets created with react in it
// why? because deno is weird with @types 
import "npm:react@18"
import "npm:react-dom@18"

import { serve } from "https://deno.land/std@0.165.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.165.0/http/file_server.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.14.51/mod.js";
import { Context, Hono } from 'hono'
import { handleRequest } from "./app/entry.server.tsx"
import { App, AppData, RouteModule } from "./app/lib.tsx";
import routes from "./routes.tsx"

declare global {
  interface Window {
    routeModules: Record<string, RouteModule>
    appContext: App
  }
}

const app = new Hono()
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

app.get("/dist/*", (c) => serveDir(c.req, {
  fsRoot: ".",
  quiet: true
}));

async function bundle(moduleTree: ModuleTree): Promise<esbuild.Metafile> {
  const res = await esbuild.build({
    entryPoints: ["./app/entry.client.tsx", ...moduleTree.map(it => it.modulePath)],
    platform: "browser",
    format: "esm",
    bundle: true,
    splitting: true,
    outdir: "dist",
    minify: false,
    treeShaking: true,
    entryNames: "[dir]/[name]-[hash]",
    chunkNames: "_shared/[name]-[hash]",
    assetNames: "_assets/[name]-[hash]",
    // outdir: ".",
    // outfile: "",
    // write: false,
    metafile: true,
    incremental: false
    // plugins: [],
  })

  return res.metafile;
}

export type ModuleTree = {
  loaderData: AppData,
  actionData: AppData,
  module: React.FC<{ children?: React.ReactNode }>,
  modulePath: string
}[]

async function handler(ctx: Context, modulePaths: string | string[]) {
  const modulePath = Array.isArray(modulePaths) ? modulePaths : [modulePaths];
  const moduleTree: ModuleTree = await Promise.all(modulePath.map(async (modulePath) => {
    const module = await import(modulePath) as RouteModule;

    return {
      loaderData: module.loader ? await module.loader(ctx) : null,
      actionData: module.action && ctx.req.method === "POST" ? await module.action(ctx) : null,
      module: module.default,
      modulePath: modulePath
    }
  }));

  const metafile = await bundle(moduleTree);
  const files = Object.entries(metafile.outputs)
    .map(([name, file]) => ({
      name,
      input: Object.keys(file.inputs)[0]
    }));

  const res = handleRequest({
    moduleTree,
    files
  })

  return ctx.html('<!DOCTYPE html>' + res);
}

await serve(app.fetch, { port: 3000 });