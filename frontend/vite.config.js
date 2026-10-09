import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^react-native\/Libraries\/Utilities\/codegenNativeComponent$/, replacement: path.resolve(__dirname, 'src/lib/codegenMock.js') },
      { find: /^lucide-react-native$/, replacement: 'lucide-react' },
      { find: /^react-native$/, replacement: path.resolve(__dirname, 'src/lib/reactNativeWebMock.js') },
    ]
  },
})

