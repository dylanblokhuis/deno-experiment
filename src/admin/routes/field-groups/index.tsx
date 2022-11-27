import React from 'react'
import db from '$db'
import { Context, useLoaderData } from '$lib'

export async function loader(ctx: Context) {
  const groups = await db.selectFrom("field_group").selectAll().execute();

  return groups;
}

export default function Fields() {
  const groups = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center">
        <h1 className='text-3xl font-bold mr-4'>Field groups</h1>
        <a className='text-blue-500 underline' href="/admin/field-groups/edit">
          Create new
        </a>
      </div>

      {groups.map((group) => (
        <div key={group.id} className='mt-4'>
          <div className='flex items-center'>
            <h2 className='text-xl font-bold mr-4'>{group.name}</h2>
            <a className='text-blue-500 underline' href={`/admin/field-groups/edit/${group.id}`}>
              Edit
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
