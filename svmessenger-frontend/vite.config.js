import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, existsSync } from 'fs';

export default defineConfig({
    plugins: [
        react(),
        // ✅ Custom plugin за премахване на index.html от build output
        {
            name: 'no-html-plugin',
            generateBundle(options, bundle) {
                // Изтрий index.html от bundle-a
                delete bundle['index.html'];
            }
        },
        // ✅ Custom plugin за копиране на call-window.html
        {
            name: 'copy-call-window-html',
            writeBundle() {
                const srcPath = resolve(__dirname, 'public/call-window.html');
                const destPath = resolve(__dirname, '../src/main/resources/static/svmessenger/call-window.html');
                
                if (existsSync(srcPath)) {
                    copyFileSync(srcPath, destPath);
                }
            }
        }
    ],

    // Build configuration
    build: {
        // Output в Spring Boot static папката
        outDir: '../src/main/resources/static/svmessenger',
        emptyOutDir: true,

        // Minification и optimization
        minify: 'terser',
        sourcemap: false,

        rollupOptions: {
            // ✅ Multiple entry points: main app и call-window
            input: {
                'svmessenger': resolve(__dirname, 'src/main.jsx'),
                'call-window': resolve(__dirname, 'src/call-window/call-window-main.jsx')
            },

            output: {
                // Separate bundle files
                entryFileNames: (chunkInfo) => {
                    return chunkInfo.name === 'call-window' ? 'call-window.js' : 'svmessenger.js';
                },
                chunkFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'call-window') {
                        return 'call-window-[name].js';
                    }
                    return 'svmessenger-[name].js';
                },
                assetFileNames: (assetInfo) => {
                    // CSS файлове - отделни за всеки entry point
                    if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                        if (assetInfo.name.includes('call-window')) {
                            return 'call-window.css';
                        }
                        return 'svmessenger.css';
                    }
                    // Други assets (images, fonts, etc.) в подпапка
                    return 'assets/[name].[ext]';
                },

                // Manual chunks за code splitting
                manualChunks: (id) => {
                    // Shared vendor chunks
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'vendor-react';
                        }
                        if (id.includes('livekit-client')) {
                            return 'vendor-livekit';
                        }
                        if (id.includes('sockjs-client') || id.includes('@stomp/stompjs')) {
                            return 'vendor-websocket';
                        }
                        return 'vendor';
                    }
                }
            }
        },

        // Chunk size warning limit
        chunkSizeWarningLimit: 1000
    },

    // Dev server configuration
    server: {
        port: 5173,
        open: false,

        // Proxy API calls към Spring Boot
        proxy: {
            '/api': {
                target: 'http://localhost:2662',
                changeOrigin: true,
                secure: false
            },
            '/ws-svmessenger': {
                target: 'ws://localhost:2662',
                ws: true,
                changeOrigin: true
            }
        }
    },

    // Optimization
    optimizeDeps: {
        include: ['react', 'react-dom', 'sockjs-client', '@stomp/stompjs']
    }
});