import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Указываем желаемый порт
    // host: '0.0.0.0', // Можно также указать хост, если нужно слушать на всех интерфейсах
  },
})



