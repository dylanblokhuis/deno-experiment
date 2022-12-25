import React from "react";
import { Context, HeadArgs } from "$lib";

export function Head(args: HeadArgs<typeof loader>) {
  return (
    <>
      <link rel="stylesheet" href="/tailwind.css" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin=""
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
    </>
  );
}

export function loader(context: Context) {
  context.set("bodyClasses", [...context.get("bodyClasses"), "admin"]);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-100 w-full h-full flex flex-col items-center justify-center">
      <div className="max-w-sm rounded-lg bg-white p-8 mx-auto w-full">
        {children}
      </div>
    </div>
  );
}
