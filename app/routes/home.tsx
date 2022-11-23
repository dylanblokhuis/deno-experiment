import React, { useState } from 'react'
import { appRouter } from '../api/router.server.ts'
import { Context, useLoaderData } from '../lib.tsx'

export async function loader(context: Context) {
  const caller = appRouter.createCaller({});
  const result = await caller.greeting({
    text: "Hello World",
  });

  return result
}

export default function Home() {
  const data = useLoaderData<typeof loader>();
  const [count, setCount] = useState(0)

  return (
    <div>
      Home: {data}

      <button onClick={() => setCount(count + 1)}>Count: {count}</button>

      <a className='bg-red-600' href='/admin'>Admin</a>
    </div>
  )
}
