import React from 'react'
import { LiveReload, Scripts } from './lib.tsx';

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
        <LiveReload />
      </body>
    </html>
  )
}
