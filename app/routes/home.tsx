import React, { useState } from 'react'

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
