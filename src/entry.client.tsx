import React, { startTransition } from 'react'
import { hydrateRoot } from "react-dom/client"
import { AppBrowser, AppContext } from './lib.tsx'
import Root from './root.tsx'

export function hydrate() {
  const callback = () => startTransition(() => {
    const app = window.appContext
    const head = app.moduleTree.filter((treeNode) => treeNode.head).map((treeNode) => {
      return treeNode.head && treeNode.head({ loaderData: treeNode.loaderData, actionData: treeNode.actionData });
    })

    hydrateRoot(document, (
      <AppContext.Provider value={app}>
        <Root head={head}>
          <AppBrowser />
        </Root>
      </AppContext.Provider>
    ))
  })

  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => callback());
  } else {
    // Safari doesn't support requestIdleCallback
    // https://caniuse.com/requestidlecallback
    // deno-lint-ignore no-window-prefix
    window.setTimeout(() => callback(), 1);
  }
}