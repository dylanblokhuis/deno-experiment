// this is just so a node_modules folder gets created with react in it
// why? because deno is weird with @types 
import "npm:react@18"
import "npm:react-dom@18"

import { serve } from "https://deno.land/std@0.165.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.165.0/http/file_server.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.14.51/mod.js";
import { Hono } from 'https://deno.land/x/hono@v2.5.2/mod.ts'
import { handleRequest } from "./app/entry.server.tsx"
import { App, RouteModule } from "./app/lib.tsx";
import routes from "./routes.tsx"

declare global {
  interface Window {
    routeModules: RouteModule[]
    appContext: App
  }
}

const app = new Hono()
for (const [route, module] of routes) {
  app.get(route, (c) => handler(c.req, module)).post(route, (c) => handler(c.req, module));
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
  loaderData: Response | null,
  actionData: Response | null,
  module: React.FC<{ children?: React.ReactNode }>,
  modulePath: string
}[]

async function handler(request: Request, modulePaths: string | string[]) {
  const modulePath = Array.isArray(modulePaths) ? modulePaths : [modulePaths];
  const moduleTree: ModuleTree = await Promise.all(modulePath.map(async (modulePath) => {
    const module = await import(modulePath) as RouteModule;

    return {
      loaderData: module.loader ? await module.loader(request) : null,
      actionData: module.action && request.method === "POST" ? await module.action(request) : null,
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

  return new Response('<!DOCTYPE html>' + res, {
    headers: {
      "content-type": "text/html",
    }
  });
}

await serve(app.fetch, { port: 3000 });