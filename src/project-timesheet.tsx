import React from "react";
import { createRoot } from "react-dom/client";
import * as SDK from "azure-devops-extension-sdk";
import { ProjectTimesheet } from "./components/ProjectTimesheet/ProjectTimesheet";
import "./styles.css";

// Entry point for the project-level Time Sheet hub contributed to the Boards
// navigation group. The work item tab has its own bundle and entry point.
SDK.init().then(async () => {
  try {
    // First line in the console: confirms which build is actually running
    console.log(
      `Time Sheet hub v${typeof __EXTENSION_VERSION__ === "string" ? __EXTENSION_VERSION__ : "unknown"} starting`,
    );
    await SDK.ready();

    const container = document.getElementById("root");
    if (container) {
      const root = createRoot(container);
      root.render(<ProjectTimesheet />);
    } else {
      console.error("Root container not found");
    }
  } catch (err) {
    console.error("Failed to initialize Azure DevOps SDK:", err);
    const container = document.getElementById("root");
    if (container) {
      container.innerHTML = `
        <div style="padding: 24px; color: #d13438;">
          <h3>Failed to load the Time Sheet hub</h3>
          <p>Error: ${err instanceof Error ? err.message : String(err)}</p>
          <p>Please refresh the page or contact your administrator.</p>
        </div>
      `;
    }
  }
});
