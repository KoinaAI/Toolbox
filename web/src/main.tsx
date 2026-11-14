import React, { lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { AppProvider } from './lib/providers'
import { AppShell } from './components/app-shell'
import { CatalogPage } from './features/catalog/catalog-page'
import { NotFound } from './components/states'
import { Toaster } from './components/ui/sonner'
import { ErrorBoundary } from './components/error-boundary'
import '@fontsource-variable/geist'
import './styles.css'

const ToolPage = lazy(() =>
  import('./features/tools/tool-page').then((module) => ({
    default: module.ToolPage,
  })),
)
const AboutPage = lazy(() =>
  import('./features/about').then((module) => ({ default: module.AboutPage })),
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <MotionConfig reducedMotion="user">
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<CatalogPage />} />
                <Route
                  path="category/:categoryId"
                  element={<CatalogPage view="category" />}
                />
                <Route
                  path="favorites"
                  element={<CatalogPage view="favorites" />}
                />
                <Route path="recent" element={<CatalogPage view="recent" />} />
                <Route path="tools/:toolId" element={<ToolPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            <Toaster />
          </MotionConfig>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
