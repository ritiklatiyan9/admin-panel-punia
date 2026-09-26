import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 5173,
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ["react", "react-dom", "react-router-dom"],
                    firebase: ["firebase/app", "firebase/auth"],
                    vendor: ["@tanstack/react-query", "axios", "zustand"],
                    // Form validation is only needed by Settings; keep it off every other route.
                    forms: ["react-hook-form", "zod"],
                },
            },
        },
    },
});
