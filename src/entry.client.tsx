import React, { startTransition } from 'react'
import { hydrateRoot } from "react-dom/client"
import { AppBrowser, AppContext } from './lib.tsx'
import Root from './root.tsx'

export function hydrate() {
  const callback = () => startTransition(() => {
    const context = window.appContext

    hydrateRoot(document, (
      <AppContext.Provider value={context}>
        <Root>
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