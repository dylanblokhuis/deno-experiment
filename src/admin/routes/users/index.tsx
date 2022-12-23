import React from 'react'

export default function Users() {
  return (
    <div>
      <div className="flex items-center gap-x-2">
        <h1 className='text-xl font-bold'>Users</h1>
        <span>-</span>
        <a href="/admin/users/edit" className="text-blue-500 underline">Add New</a>
      </div>

    </div>
  )
}
