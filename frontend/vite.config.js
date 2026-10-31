import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Remonte d'un niveau pour charger le fichier .env a la racine de Dasharr
  envDir: '../',
  // Expose les variables commencant par VITE_ et API_ dans import.meta.env
  envPrefix: ['VITE_', 'API_'],
})
