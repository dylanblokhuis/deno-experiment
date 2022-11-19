import React, { startTransition } from 'react'
import { hydrateRoot } from "react-dom/client"
import { AppContext, RouteModule } from './lib.tsx'
import Root from './root.tsx'

export function hydrate(Module: RouteModule) {
  const callback = (Module: RouteModule) => startTransition(() => {
    // @ts-expect-error its the appContext
    const context = window.appContext

    hydrateRoot(document, (
      <AppContext.Provider value={context}>
        <Root>
          <Module.default />
        </Root>
      </AppContext.Provider>
    ))
  })

  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => callback(Module));
  } else {
    // Safari doesn't support requestIdleCallback
    // https://caniuse.com/requestidlecallback
    window.setTimeout(() => callback(Module), 1);
  }
}