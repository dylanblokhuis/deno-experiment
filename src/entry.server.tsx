import React from 'react'
import { renderToString } from "react-dom/server";
import { App, AppContext, RouteContext } from './lib.tsx';
import Root from './root.tsx';

export function handleRequest(app: App) {
  const headElements = app.moduleTree.map((treeNode) => {
    return treeNode.head && treeNode.head({ loaderData: treeNode.loaderData, actionData: treeNode.actionData });
  }).filter((head) => head);

  function recursive(index: number, Module?: React.FC<{ children?: React.ReactNode }>) {
    if (index === app.moduleTree.length && Module) {
      return <Module children={null} />;
    }

    const treeNode = app.moduleTree[index];
    const Current = treeNode.module!;
    if (Module?.propTypes?.children) {
      return <Module children={
        <RouteContext.Provider value={treeNode.modulePath}>
          <Current children={recursive(index + 1, Current)} />
        </RouteContext.Provider>
      } />
    }

    return <RouteContext.Provider value={treeNode.modulePath}><Current children={recursive(index + 1, Current)} /></RouteContext.Provider>
  }

  return renderToString(
    <AppContext.Provider value={app}>
      <Root head={headElements}>
        {recursive(0)}
      </Root>
    </AppContext.Provider>
  ) as string;
}