import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, API/uploads/websocket calls are proxied to the Express server,
// so you don't need VITE_API_URL locally.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
      "/socket.io": { target: "http://localhost:4000", ws: true },
    },
  },
});
