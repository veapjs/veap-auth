import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "node",
    globals: false,
    env: {
      ENCRYPTION_KEY: "MDEyMzQ1Njc4OWFiY2RlZg==",
    },
    server: {
      deps: {
        inline: [/@veap\//],
      },
    },
  },
});
