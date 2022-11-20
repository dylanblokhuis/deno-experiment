import React from 'react'
import { renderToString } from "react-dom/server";
import { App, AppContext } from './lib.tsx';
import Root from './root.tsx';

export function handleRequest(app: App) {
  function recursive(index: number, Module?: React.FC<{ children?: React.ReactNode }>) {
    if (index === app.moduleTree.length && Module) {
      return <Module children={null} />;
    }

    const Current = app.moduleTree[index].module;
    if (Module?.propTypes?.children) {
      return <Module children={<Current children={recursive(index + 1, Current)} />} />
    }

    return <Current children={recursive(index + 1, Current)} />
  }

  return renderToString(
    <AppContext.Provider value={app}>
      <Root>
        {recursive(0)}
      </Root>
    </AppContext.Provider>
  );
}