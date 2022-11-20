import React from 'react'
import { useLoaderData } from '../lib.tsx';

export function loader(request: Request) {
  return {
    text: "im a layout!"
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      Layout: {data.text}
      {children}
    </div>
  )
}
