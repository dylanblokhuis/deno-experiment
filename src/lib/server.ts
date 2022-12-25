import { appRouterCaller } from "../api/router.server.ts";
import db from "../db/db.server.ts";
import { Context } from "../lib.tsx";
import { runtimeRoutes } from "../routes.tsx";

export { commitSession, getSession } from "./session.server.ts";

export type RedirectFunction = (
  url: string,
  init?: number | ResponseInit,
) => TypedResponse<never>;

export const redirect: RedirectFunction = (url, init = 302) => {
  let responseInit = init;
  if (typeof responseInit === "number") {
    responseInit = { status: responseInit };
  } else if (typeof responseInit.status === "undefined") {
    responseInit.status = 302;
  }

  const headers = new Headers(responseInit.headers);
  headers.set("Location", url);

  return new Response(null, {
    ...responseInit,
    headers,
  }) as TypedResponse<never>;
};

export type TypedResponse<T extends unknown = unknown> =
  & Omit<
    Response,
    "json"
  >
  & {
    json(): Promise<T>;
  };

export type JsonFunction = <Data extends unknown>(
  data: Data,
  init?: number | ResponseInit,
) => TypedResponse<Data>;

export const json: JsonFunction = (data, init = {}) => {
  const responseInit = typeof init === "number" ? { status: init } : init;

  const headers = new Headers(responseInit.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(data), {
    ...responseInit,
    headers,
  });
};

export class Post {
  private id: number;
  private ctx: Context;
  constructor(ctx: Context, id: number) {
    this.ctx = ctx;
    this.id = id;
  }

  async data() {
    const post = await appRouterCaller(this.ctx).getPost({ id: this.id });
    return post;
  }
}

export async function generateRuntimeRoutes() {
  const posts = await db
    .selectFrom("post")
    .innerJoin("post_type", "post_type.id", "post_type_id")
    .select([
      "post.id",
      "post.slug",
      "post_type.path_prefix",
      "post_type.slug as post_type_slug",
    ])
    .execute();

  runtimeRoutes.clear();
  for (const post of posts) {
    const route = post.path_prefix
      ? `${post.path_prefix}/${post.slug}`
      : `/${post.slug}`;
    runtimeRoutes.set(route, [
      post.id,
      `../templates/${post.post_type_slug}.tsx`,
    ]);
  }
}

export function headersToObject(headers: Headers) {
  const obj: Record<string, string> = {};
  for (const [key, value] of headers) {
    obj[key] = value;
  }
  return obj;
}
