import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react'

const filesToInclude =[
    '**/src/App.jsx',
    '**/src/utils/*.jsx',
    '**/src/views/**/*.jsx',
    '**/src/components/Home/*.jsx',
    '**/src/components/Layout/*.jsx'
]

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        coverage: {
            reporter: ['text', 'json-summary', 'json', 'html'],
            include:[...filesToInclude],
        },
        css: true,
        environment: "jsdom"

    }
});