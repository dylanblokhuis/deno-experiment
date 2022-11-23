import React from 'react'
import { Context } from '../lib.tsx'

export function loader(context: Context) {
  context.set("bodyClasses", [...context.get("bodyClasses"), "admin"]);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex bg-slate-100 w-full h-full'>
      <aside className='bg-slate-900 text-white flex-none w-64 p-4'>
        Home
      </aside>

      <main className='w-full'>
        {children}
      </main>
    </div>
  )
}
