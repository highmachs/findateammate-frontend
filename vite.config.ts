import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa';

// Plugin to inject app version at build time
const appVersionPlugin = {
  name: 'app-version-injector',
  apply: 'build' as const,
  transformIndexHtml(html: string) {
    const version = new Date().getTime().toString(); // Use timestamp as version
    return html.replace(/__APP_VERSION__/g, version);
  }
} as any;

export default defineConfig({
  plugins: [
    appVersionPlugin,
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Avoid hijacking backend routes like /api/auth/google
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'FindATeammate',
        short_name: 'FindATeammate',
        description: 'Connect with teammates for hackathons and events',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['wouter'],
          'query': ['@tanstack/react-query'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
        },
      },
    },
  },
});
