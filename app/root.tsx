import React from 'react'
import { Scripts } from './lib.tsx';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <title>Hey</title>
        <link rel="stylesheet" href="tailwind.css" />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
