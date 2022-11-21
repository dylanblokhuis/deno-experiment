import React, { useState } from 'react'
import { appRouter } from '../api/router.server.ts'
import { Context } from '../lib.tsx'

export async function loader(context: Context) {
  const caller = appRouter.createCaller({});
  const result = await caller.greeting({
    text: "Hello World",
  });

  console.log(result);

  return {}
}

export default function Home() {
  const [count, setCount] = useState(0)
  return (
    <div>
      Home

      <button onClick={() => setCount(count + 1)}>Count: {count}</button>

      <a href='/admin'>Admin</a>
    </div>
  )
}
