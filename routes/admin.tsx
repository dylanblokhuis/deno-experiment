import React from 'react'
import { useLoaderData } from '../lib.tsx'



export function loader(request: Request) {
  return {
    text: "hello"
  }
}

export default function Admin() {
  const data = useLoaderData<typeof loader>();

  console.log(data);

  return (
    <div>Hello: {data.text}</div>
  )
}