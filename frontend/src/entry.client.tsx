// src/entry.client.tsx
import { createRoot, hydrateRoot } from "react-dom/client";
import { StrictMode } from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import routes from "~react-pages";
import { LayoutResolver } from "./LayoutResolver";

function App() {
  const element = useRoutes(routes);
  return <LayoutResolver>{element}</LayoutResolver>;
}

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
} else {
  hydrateRoot(
    document,
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
}
