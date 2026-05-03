import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Allow Emergent preview subdomains (and local dev)
    allowedHosts: true,
    // Also allow any subdomain of emergentcf.cloud / emergentagent.com
    hmr: { clientPort: 443 },
  },
})
