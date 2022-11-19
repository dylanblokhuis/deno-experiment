import React from 'react'
import { hydrateRoot } from "react-dom/client"
import { AppContext, RouteModule } from './lib.tsx'
import Root from './root.tsx'

export function hydrate(Module: RouteModule) {
  // @ts-expect-error its the appContext
  const context = window.appContext

  hydrateRoot(document, (
    <AppContext.Provider value={context}>
      <Root>
        <Module.default />
      </Root>
    </AppContext.Provider>
  ))
}
