import React from 'react'
import { Context, useLoaderData } from '../lib.tsx'

export function loader(ctx: Context) {
  return {
    text: "hello"
  }
}

export default function Admin() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>Hello: {data.text}
      <form method='post'>
        <input type="text" name="text" />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}