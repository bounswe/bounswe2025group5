// src/entry.client.tsx
import { createRoot, hydrateRoot } from "react-dom/client";
import { StrictMode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./root";
import Index from "./routes/_index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <Index /> },
    ],
  },
]);

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
} else {
  hydrateRoot(
    document,
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}
