import React from 'react'
import { Context, useLoaderData } from '$lib'
import { appRouterCaller } from '../../../api/router.server.ts';
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
      {postType.name} - <a className='text-blue-500 underline' href={`/admin/posts/edit?postType=${postType.slug}`}>Add New</a>

      <table className='w-full'>
        <thead className='text-left'>
          <tr>
            <th>Title</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td><a className='text-blue-500 underline' href={`/admin/posts/edit?postType=${postType.slug}&id=${post.id}`}>{post.title}</a></td>
              <td>{post.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
