import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Forces the frontend to always run on local port 5173
    open: true, // Automatically opens the app in your default web browser on start
  }
});
