import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import DevicePreview from "./components/DevicePreview";
import { DemoProvider } from "./state/DemoContext";
import "./index.css";

// The app is full-bleed responsive (RESPONSIVE_WEB_PRD.md §6). `?frame=phone`
// is an opt-in device preview: it renders the app inside an iframe'd phone frame
// so CSS breakpoints resolve to the phone width and the true mobile layout shows
// on a desktop. Toggle it from the DemoMenu.
const devicePreview = new URLSearchParams(window.location.search).get("frame") === "phone";
if (devicePreview) document.body.dataset.frame = "phone";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {devicePreview ? (
      <DevicePreview />
    ) : (
      <BrowserRouter>
        <DemoProvider>
          <App />
        </DemoProvider>
      </BrowserRouter>
    )}
  </React.StrictMode>
);
