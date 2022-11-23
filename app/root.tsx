import React from 'react'
import { LiveReload, Scripts, useApp } from './lib.tsx';

export default function Root({ children }: { children: React.ReactNode }) {
  const app = useApp();

  return (
    <html>
      <head>
        <title>Hey</title>
        <link rel="stylesheet" href="tailwind.css" />
      </head>
      <body className={app.variables.bodyClasses.join(" ")}>
        {children}
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
