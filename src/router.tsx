import Control from "./pages/Control";
import Launcher from "./pages/Launcher";
import NotFound from "./pages/NotFound";
import Stage from "./pages/Stage";

export const routers = [
  {
    path: "/",
    name: "home",
    element: <Launcher />,
  },
  {
    path: "/control",
    name: "control",
    element: <Control />,
  },
  {
    path: "/stage",
    name: "stage",
    element: <Stage />,
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
