import { defineConfig } from "vitest/config"; // eslint-disable-line import/no-unresolved

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.js"],
    exclude: ["test/_*.js", "test/**/_*.js"],
    coverage: {
      enabled: true,
      provider: "v8",
      lines: 100,
      statements: 100,
      functions: 100,
      branches: 93,
      reporter: ["lcov", "text-summary"],
      exclude: ["test/**", "vitest.config.js", "**/*.d.ts", "**/*.config.js", "**/mockData.js", "**/.eslintrc.js"],
    },
  },
});
