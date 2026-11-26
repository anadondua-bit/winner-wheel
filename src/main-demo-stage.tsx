import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "./components/error-boundary/error-fallback";
import { seedDemoStorage } from "./lib/demo-seed";
import StageDemo from "./pages/StageDemo";
import "./index.css";

/** Entry for the standalone Stage Display demo build — see demo/stage.html. */
seedDemoStorage();

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container #root was not found.");
}

createRoot(container).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <TooltipProvider>
      <Sonner />
      <StageDemo />
    </TooltipProvider>
  </ErrorBoundary>,
);
