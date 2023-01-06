// deno-lint-ignore-file no-explicit-any ban-types
import React, { useEffect, useState, useContext, createContext } from "react";
import { ModuleTree } from "./main.tsx";
import config from "./config.ts";
import type { Admin } from "./admin/layout/admin.tsx";
import { Post } from "./lib/server.ts";
import { Context as EmptyContext, Handler as EmptyHandler } from "./server.ts";

export type ContextVariables = {
  bodyClasses: string[];
  admin?: Admin;
  post: Post;
};
export type Context = EmptyContext<ContextVariables>;
export type Handler = EmptyHandler<ContextVariables>;
export interface App {
  moduleTree: ModuleTree;
  files: {
    name: string;
    input: string;
  }[];
  variables: ContextVariables;
}
export const AppContext = createContext<App | null>(null);
export const RouteContext = createContext<string | null>(null);

export function Scripts() {
  const context = useContext(AppContext);
  if (!context) return <></>;

  const entryModule = context.files.find((file) => {
    return file.name.includes("entry.client");
  });

  const routes: Record<string, string> = {};
  for (const module of context.moduleTree) {
    context.files.forEach((item) => {
      if (
        item.input.replace(/^(.*):/, "") ===
          `${module.modulePath}?browser`
      ) {
        routes[module.modulePath] = item.name;
      }
    });
  }

  const routeModules: Record<string, string> = {};
  Object.entries(routes).forEach(([modulePath], index) => {
    routeModules[modulePath] = `route${index}`;
  });
  // instead of "route0", we want to remove the quotes so it matches the modules from the import
  const routeModulesJson = JSON.stringify(routeModules).replace(
    /\"route([0-9])\"/g,
    "route$1",
  );

  return (
    <>
      {context?.files.map((file) => (
        <link
          rel="modulepreload"
          key={file.name}
          href={`/${file.name}`}
        />
      ))}

      <script
        dangerouslySetInnerHTML={{
          __html: `window.appContext = ${JSON.stringify(context)}`,
        }}
      >
      </script>
      <script
        type="module"
        async
        dangerouslySetInnerHTML={{
          __html: `
import { hydrate } from "/${entryModule?.name}";
${
            Object.entries(routes).map((it, index) =>
              `import * as route${index} from "/${it[1]}";`
            ).join("\n")
          }

window.routeModules = ${routeModulesJson};

hydrate()
        `,
        }}
      >
      </script>
    </>
  );
}

export function AppBrowser() {
  function recursive(
    index: number,
    Module?: React.FC<{ children?: React.ReactNode }>,
  ) {
    const routeModules = Object.entries(window.routeModules);
    if (index === routeModules.length && Module) {
      return <Module children={null} />;
    }

    const [modulePath, module] = routeModules[index];
    const Current = module.default!;
    if (Module?.propTypes?.children) {
      return (
        <Module
          children={
            <RouteContext.Provider value={modulePath}>
              <Current children={recursive(index + 1, Current)} />
            </RouteContext.Provider>
          }
        />
      );
    }

    return (
      <RouteContext.Provider value={modulePath}>
        <Current children={recursive(index + 1, Current)} />
      </RouteContext.Provider>
    );
  }

  return recursive(0);
}

export interface RouteModule {
  default?: React.FC<{ children?: React.ReactNode }>;
  loader?: (ctx: Context) => Promise<Response>;
  action?: (ctx: Context) => Promise<Response>;
  Head?: React.FC;
}

export function useLoaderData<T = AppData>(): SerializeFrom<T> {
  const appContext = useContext(AppContext);
  const modulePath = useContext(RouteContext);

  if (!appContext || !modulePath) {
    throw new Error("useLoaderData must be used inside a route component");
  }

  const module = appContext.moduleTree.find((item) =>
    item.modulePath === modulePath
  );
  return module?.loaderData;
}

export function useActionData<T = AppData>(): SerializeFrom<T> | null {
  const appContext = useContext(AppContext);
  const modulePath = useContext(RouteContext);

  if (!appContext || !modulePath) {
    throw new Error("useLoaderData must be used inside a route component");
  }

  const module = appContext.moduleTree.find((item) =>
    item.modulePath === modulePath
  );
  return module?.actionData;
}

export type HeadArgs<L = AppData, A = AppData> = {
  loaderData?: SerializeFrom<L>;
  actionData?: SerializeFrom<A>;
};

// this part is created by the remix team, all credit to them https://github.com/remix-run/remix
export type AppData = any;

type JsonPrimitive =
  | string
  | number
  | boolean
  | String
  | Number
  | Boolean
  | null;
type NonJsonPrimitive = undefined | Function | symbol;

/*
 * `any` is the only type that can let you equate `0` with `1`
 * See https://stackoverflow.com/a/49928360/1490091
 */
type IsAny<T> = 0 extends 1 & T ? true : false;

// prettier-ignore
type Serialize<T> = IsAny<T> extends true ? any
  : T extends JsonPrimitive ? T
  : T extends NonJsonPrimitive ? never
  : T extends { toJSON(): infer U } ? U
  : T extends [] ? []
  : T extends [unknown, ...unknown[]] ? SerializeTuple<T>
  : T extends ReadonlyArray<infer U>
    ? (U extends NonJsonPrimitive ? null : Serialize<U>)[]
  : T extends object ? SerializeObject<UndefinedToOptional<T>>
  : never;

/** JSON serialize [tuples](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types) */
type SerializeTuple<T extends [unknown, ...unknown[]]> = {
  [k in keyof T]: T[k] extends NonJsonPrimitive ? null : Serialize<T[k]>;
};

/** JSON serialize objects (not including arrays) and classes */
type SerializeObject<T extends object> = {
  [k in keyof T as T[k] extends NonJsonPrimitive ? never : k]: Serialize<
    T[k]
  >;
};

/*
 * For an object T, if it has any properties that are a union with `undefined`,
 * make those into optional properties instead.
 *
 * Example: { a: string | undefined} --> { a?: string}
 */
type UndefinedToOptional<T extends object> =
  & {
    // Property is not a union with `undefined`, keep as-is
    [k in keyof T as undefined extends T[k] ? never : k]: T[k];
  }
  & {
    // Property _is_ a union with `defined`. Set as optional (via `?`) and remove `undefined` from the union
    [k in keyof T as undefined extends T[k] ? k : never]?: Exclude<
      T[k],
      undefined
    >;
  };

type ArbitraryFunction = (...args: any[]) => unknown;
export type TypedResponse<T extends unknown = unknown> = Response & {
  json(): Promise<T>;
};
/**
 * Infer JSON serialized data type returned by a loader or action.
 *
 * For example:
 * `type LoaderData = SerializeFrom<typeof loader>`
 */
export type SerializeFrom<T extends AppData | ArbitraryFunction> = Serialize<
  T extends (...args: any[]) => infer Output
    ? Awaited<Output> extends TypedResponse<infer U> ? U
    : Awaited<Output>
    : Awaited<T>
>;

// routing
export type Module = string | string[];
export type Route = [string, Module] | [string, Handler | Handler[], Module];

export interface Config {
  mode: "development" | "production";
  livereloadWsPort: number;
  admin: {
    email: string;
    password: string;
  };
}

export const LiveReload = config.mode !== "development"
  ? () => null
  : function LiveReload({
    port = Number(config.livereloadWsPort || 8002),
  }: {
    port?: number;
  }) {
    const js = String.raw;
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: js`
                function liveReloadConnect(config) {
                  let protocol = location.protocol === "https:" ? "wss:" : "ws:";
                  let host = location.hostname;
                  let socketPath = protocol + "//" + host + ":" + ${
            String(
              port,
            )
          } + "/socket";
                  let ws = new WebSocket(socketPath);
                 
                  ws.onopen = () => {
                    if (config && typeof config.onOpen === "function") {
                      config.onOpen();
                    }
                  };
                  ws.onclose = (error) => {
                    console.log("Livereload socket closed. Reconnecting...");
                    setTimeout(
                      () =>
                        liveReloadConnect({
                          onOpen: () => window.location.reload(),
                        }),
                      500
                    );
                  };
                  ws.onerror = (error) => {
                    console.log("Socket error:");
                    console.error(error);
                  };
                }
                liveReloadConnect();
              `,
        }}
      />
    );
  };

export function useApp(): App {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp used outside of AppContext");
  return context;
}

let hydrating = true;

function useHydrated() {
  let [hydrated, setHydrated] = useState(() => !hydrating);

  useEffect(function hydrate() {
    hydrating = false;
    setHydrated(true);
  }, []);

  return hydrated;
}

export function ClientOnly({ children, fallback = null }: {
  /**
   * You are encouraged to add a fallback that is the same dimensions
   * as the client rendered children. This will avoid content layout
   * shift which is disgusting
   */
  children(): React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return useHydrated() ? <>{children()}</> : <>{fallback}</>;
}
