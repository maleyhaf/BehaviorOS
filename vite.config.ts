/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Only measure the engine modules under test (see assignment scope)
      include: [
        'src/engine/playerModel.ts',
        'src/engine/adaptiveOpponent.ts',
        'src/engine/reportGenerator.ts',
      ],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
})
