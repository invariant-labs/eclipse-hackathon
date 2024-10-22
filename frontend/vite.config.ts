import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import topLevelAwait from 'vite-plugin-top-level-await'
import { compression } from 'vite-plugin-compression2'
import inject from '@rollup/plugin-inject'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(), topLevelAwait(), compression(), nodePolyfills()],
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
      plugins: [inject({ Buffer: ['buffer', 'Buffer'] })]
    }
  }
})
