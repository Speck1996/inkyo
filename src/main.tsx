import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@/design/theme'
import { App } from '@/app/App'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@/styles/global.css'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
)
