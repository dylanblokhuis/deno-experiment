import React from 'react'
import { Context, useLoaderData } from '$lib'
import { appRouterCaller } from '../../api/router.server.ts';
import { redirect } from '$lib/server.ts';

export async function loader(ctx: Context) {
  const postTypeSlug = new URL(ctx.req.url).searchParams.get("postType") || "post";
  const postType = await appRouterCaller.getPostType({ slug: postTypeSlug });
  if (!postType) throw redirect("/admin");
  return {
    posts: await appRouterCaller.getPosts({ postType: postType.id }),
    postType: postType
  }
}


export default function Posts() {
  const { posts, postType } = useLoaderData<typeof loader>();

  return (
    <div>
      {postType.name}

      <table className='w-full'>
        <thead>
          <tr>
            <th>Title</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>{post.title}</td>
              <td>{post.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
