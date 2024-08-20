import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import topLevelAwait from 'vite-plugin-top-level-await'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  plugins: [react(), topLevelAwait(), compression()],
  resolve: {
    alias: {
      '@components': '/src/components',
      '@containers': '/src/containers',
      '@pages': '/src/pages',
      '@static': '/src/static',
      '@store': '/src/store',
      '@web3': '/src/web3',
      '@utils': '/src/utils',
      '@/': '/src'
    }
  },
  server: {
    host: 'localhost',
    port: 3000
  },
  build: {
    rollupOptions: {
      external: ['fs/promises', 'path']
    }
  },
  define: {
    'process.env.NODE_DEBUG': 'false'
  }
})
