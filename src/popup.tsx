import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import PopupApp from "./PopupApp";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <TooltipProvider>
    <Sonner position="top-center" />
    <PopupApp />
  </TooltipProvider>
);
