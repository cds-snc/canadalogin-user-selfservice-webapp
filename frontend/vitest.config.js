import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react'

const filesToInclude = [
    '**/src/App.jsx',
    '**/src/utils/*.jsx',
    '**/src/views/**/*.jsx',
    '**/src/components/**/*.jsx'
]

const filesToExclude = [

]
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
            include: [...filesToInclude],
            exclude: [...filesToExclude],
            thresholds: {
                lines: 80,
                branches: 80,
                functions: 80,
                statements: 80
            }
        },
        css: true,
        environment: "jsdom"
    }
});