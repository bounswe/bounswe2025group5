// src/entry.server.tsx
import { renderToString } from "react-dom/server";
import { ServerRouter } from "react-router";
import type { EntryContext } from "react-router";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  const html = renderToString(
    <ServerRouter context={routerContext} url={request.url} />
  );

  return new Response(`<!DOCTYPE html>${html}`, {
    status: responseStatusCode,
    headers: {
      ...Object.fromEntries(responseHeaders),
      "Content-Type": "text/html",
    },
  });
}