import { appRouterCaller } from "../api/router.server.ts";

export { getSession, commitSession } from "./session.server.ts"

export type RedirectFunction = (
  url: string,
  init?: number | ResponseInit
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

export type TypedResponse<T extends unknown = unknown> = Omit<
  Response,
  "json"
> & {
  json(): Promise<T>;
};

export type JsonFunction = <Data extends unknown>(
  data: Data,
  init?: number | ResponseInit
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
}

export class Post {
  private id: number;
  constructor(id: number) {
    this.id = id;
  }

  async data() {
    const post = await appRouterCaller.getPost({ id: this.id });
    return post;
  }
}