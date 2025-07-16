import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react'

const filesToInclude = [
    '**/src/App.jsx',
    '**/src/utils/*',
    '**/src/hooks/*',
    '**/src/views/**/*',
    '**/src/components/**/*',
    '**/src/services/*',
    '**/src/locales/**/*'
]

const filesToExclude = [];
export default defineConfig({
    plugins: [react()],
    preview: {
        port: 3001,
    },
    dev: {
        port: 3000,
    },
    test: {
        globals: true,
        coverage: {
            reporter: ['text', 'json-summary', 'json', 'html'],
            reportOnFailure: true,
            all: true,
            enabled: true,
            provider: 'istanbul',
            include: [...filesToInclude],
            exclude: [...filesToExclude],
            thresholds: {
                lines: 20,
                branches: 20,
                functions: 20,
                statements: 20
            }
        },
        css: true,
        environment: "jsdom"
    }
});