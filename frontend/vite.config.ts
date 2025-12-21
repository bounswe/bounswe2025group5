import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import Pages from "vite-plugin-pages";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  envDir: path.resolve(__dirname, ".."),
  plugins: [
    react(),
    tailwindcss(),
    Pages({
      dirs: 'src/routes',
      extensions: ['tsx', 'ts'],
      exclude: ['**/components/**'],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: 'localhost',
    open: false,
    proxy: {
      // Proxy API requests to Spring Boot backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: ['waste-less.alibartukonca.org'],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
    css: true,
    passWithNoTests: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
    },
    reporters: [
      "default",
      [
        "junit",
        { outputFile: "reports/frontend/unit/vitest-junit.xml" },
      ],
    ],
  },
});

