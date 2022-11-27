import React from 'react'
import db from '$db'
import { Context, useLoaderData } from '$lib'

export async function loader(ctx: Context) {
  const posts = await db.selectFrom("post").selectAll().execute();
  return posts;
}


export default function Posts() {
  const posts = useLoaderData<typeof loader>();

  return (
    <div>
      Posts

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
