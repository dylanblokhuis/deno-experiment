import React from 'react'
import { appRouterCaller } from '../../../api/router.server.ts'
import { useLoaderData } from '../../../lib.tsx';
import { Context } from '../../../server.ts'

export async function loader(ctx: Context) {
  const users = await appRouterCaller(ctx).getUsers();
  return { users };
}

export default function Users() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center gap-x-2">
        <h1 className='text-xl font-bold'>Users</h1>
        <span>-</span>
        <a href="/admin/users/edit" className="text-blue-500 underline">Add New</a>
      </div>

      <div className="mt-4">
        <table className="w-full">
          <thead className='text-left'>
            <tr>
              <th className="border-b-2 border-gray-200">Name</th>
              <th className="border-b-2 border-gray-200">Email</th>
              <th className="border-b-2 border-gray-200">Role</th>
              <th className="border-b-2 border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border-b border-gray-200">{user.name}</td>
                <td className="border-b border-gray-200">{user.email}</td>
                <td className="border-b border-gray-200">{user.role}</td>
                <td className="border-b border-gray-200">
                  <a href={`/admin/users/edit?id=${user.id}`} className="text-blue-500 underline">Edit</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
