import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@payload-config': path.resolve(__dirname, 'src/payload.config.ts'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/int/**/*.int.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
    hookTimeout: 300_000,
    testTimeout: 60_000,
    fileParallelism: false,
  },
})
