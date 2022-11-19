// this is just so a node_modules folder gets created with react in it
// why? because deno is weird with @types 
import "npm:react@18"
import "npm:react-dom@18"

import { serve } from "https://deno.land/std@0.165.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.165.0/http/file_server.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.14.51/mod.js";
import { handleRequest } from "./entry.server.tsx"
import { RouteModule } from "./lib.tsx";

async function bundle(moduleRoute: string): Promise<esbuild.Metafile> {
  const res = await esbuild.build({
    entryPoints: ["./lib.tsx", "./root.tsx", "entry.client.tsx", moduleRoute],
    platform: "browser",
    format: "esm",
    bundle: true,
    splitting: true,
    outdir: "dist",
    minify: false,
    // outdir: ".",
    // outfile: "",
    // write: false,
    metafile: true,
    incremental: true
    // plugins: [],
  })

  return res.metafile;
}

async function handler(request: Request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/dist")) {
    return serveDir(request, {
      fsRoot: ".",
    });
  }

  let modulePath;
  if (url.pathname === "/") {
    modulePath = "./routes/home.tsx";
  }

  if (url.pathname === "/admin") {
    modulePath = "./routes/admin.tsx";
  }

  if (!modulePath) {
    return new Response("Not found", { status: 404 });
  }

  const module = await import(modulePath) as RouteModule;

  let loaderData: any;
  if (module.loader) {
    loaderData = module.loader(request);
  }

  const metafile = await bundle(modulePath);

  const route = Object.entries(metafile.outputs).find(([key, value]) => {
    return value.entryPoint?.startsWith("routes/");
  });

  if (!route) {
    return new Response("Not found", { status: 404 });
  }

  const res = handleRequest(
    module,
    {
      scripts: Object.keys(metafile.outputs),
      routePath: route[0],
      loaderData
    }
  )

  return new Response('<!DOCTYPE html>' + res, {
    headers: {
      "content-type": "text/html",
    }
  });
}

await serve(handler, { port: 3000 });