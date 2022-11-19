import React from 'react'
import { renderToString } from "react-dom/server";
import { App, AppContext, RouteModule } from './lib.tsx';
import Root from './root.tsx';

export function handleRequest(Module: RouteModule, app: App) {
  return renderToString(
    <AppContext.Provider value={app}>
      <Root>
        <Module.default />
      </Root>
    </AppContext.Provider>
  );
}