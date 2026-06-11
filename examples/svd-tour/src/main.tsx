import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PresentationApp } from "@spatial-present/renderer";
import { AtriumWorld, SpectralWorld } from "@spatial-present/worlds";
import { journey } from "./journey/project";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PresentationApp
      journey={journey}
      worlds={{ atrium: AtriumWorld, spectral: SpectralWorld }}
    />
  </StrictMode>
);
