import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

// Standalone hosting; the existing vite.config.ts remains available for Sites.
export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      configPath: "wrangler.cloudflare.json",
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      inspectorPort: false,
    }),
  ],
});
