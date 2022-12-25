import React from "react";
import { Context, useLoaderData } from "$lib";

export async function loader(context: Context) {
  const post = context.get("post");
  const data = await post.data();
  if (!data) throw new Error("Post not found");
  return data;
}

export default function Post() {
  const data = useLoaderData<typeof loader>();

  return <div>Page: {data.title}</div>;
}
