import React from 'react'
import db from '../db/db.server.ts'
import { Context, useApp } from '../lib.tsx'

interface MenuItem {
  pathname: string
  name: string
}
export class Admin {
  menuItems: MenuItem[] = []

  addMenuItem(menuItem: MenuItem) {
    this.menuItems.push(menuItem)
  }
}

export async function loader(context: Context) {
  context.set("bodyClasses", [...context.get("bodyClasses"), "admin"]);

  const admin = context.get("admin")
  admin.addMenuItem({
    pathname: "/admin",
    name: "Dashboard"
  })
  admin.addMenuItem({
    pathname: "/admin/posts",
    name: "Posts"
  })
  admin.addMenuItem({
    pathname: "/admin/field-groups",
    name: "Field Groups"
  })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { variables } = useApp();

  return (
    <div className='flex bg-slate-100 w-full h-full'>
      <aside className='bg-slate-900 text-white flex-none w-64 p-4'>
        <ul className='flex flex-col gap-y-2'>
          {variables.admin.menuItems.map((item) => (
            <li key={item.pathname}>
              <a href={item.pathname}>{item.name}</a>
            </li>
          ))}
        </ul>
      </aside>

      <main className='w-full px-6 py-4 overflow-auto'>
        {children}
      </main>
    </div>
  )
}
