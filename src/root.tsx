import React from "react";
import { LiveReload, Scripts, useApp } from "./lib.tsx";

export default function Root(
  { children, head }: { children: React.ReactNode; head: React.ReactNode },
) {
  const app = useApp();

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>🧙</title>
        {head}
      </head>
      <body className={app.variables.bodyClasses.join(" ")}>
        {children}
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
