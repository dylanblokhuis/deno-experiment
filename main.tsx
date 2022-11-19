// this is just so a node_modules folder gets created with react in it
// why? because deno is weird with @types 
import "npm:react@18"
import "npm:react-dom@18"

import { serve } from "https://deno.land/std@0.165.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.165.0/http/file_server.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.14.51/mod.js";
import { Hono } from 'https://deno.land/x/hono@v2.5.2/mod.ts'
import { handleRequest } from "./app/entry.server.tsx"
import { RouteModule } from "./app/lib.tsx";
import routes from "./routes.tsx"

const app = new Hono()
for (const [route, module] of routes) {
  app.get(route, (c) => handler(c.req, module)).post(route, (c) => handler(c.req, module));
}
app.get("/dist/*", (c) => serveDir(c.req, {
  fsRoot: ".",
  quiet: true
}));

async function bundle(moduleRoute: string): Promise<esbuild.Metafile> {
  const res = await esbuild.build({
    entryPoints: ["./app/entry.client.tsx", moduleRoute],
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


async function handler(request: Request, modulePath: string) {
  const module = await import(modulePath) as RouteModule;
  let loaderData: any;
  if (module.loader) {
    loaderData = module.loader(request);
  }

  let actionData: any;
  if (module.action && request.method === "POST") {
    actionData = module.action(request)
  }

  const metafile = await bundle(modulePath);
  const route = Object.entries(metafile.outputs).find(([key, value]) => {
    return value.entryPoint?.startsWith("app/routes/");
  });

  if (!route) {
    console.error(route)
    throw new Error("This module doesnt exist")
  }

  const res = handleRequest(
    module,
    {
      scripts: Object.keys(metafile.outputs),
      routePath: route[0],
      loaderData,
      actionData
    }
  )

  return new Response('<!DOCTYPE html>' + res, {
    headers: {
      "content-type": "text/html",
    }
  });
}

await serve(app.fetch, { port: 3000 });