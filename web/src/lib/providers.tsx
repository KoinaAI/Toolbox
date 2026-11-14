import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { EMPTY_IDS, usePreference, validIds, validTheme, type Theme } from './storage'
import type { Catalog } from './types'

interface State {
  catalog: Catalog | null
  error: string | null
  reload: () => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  recent: string[]
  recordVisit: (id: string) => void
  clearRecent: () => void
  theme: Theme
  setTheme: (theme: Theme) => void
}
const AppContext = createContext<State | null>(null)

/** Centralizes directory state and browser-local preferences without coupling tool implementations. */
export function AppProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [favorites, setFavorites] = usePreference('toolbox.favorites', EMPTY_IDS, validIds)
  const [recent, setRecent] = usePreference('toolbox.recent', EMPTY_IDS, validIds)
  const [theme, setTheme] = usePreference<Theme>('toolbox.theme', 'system', validTheme)
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(new DOMException('目录请求超时，请重试', 'TimeoutError')), 12000)
    setError(null)
    fetch('/api/v1/catalog', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`目录暂时不可用（${response.status}）`)
        const data: unknown = await response.json()
        if (!isCatalog(data)) throw new Error('目录格式不正确，请联系站点维护者')
        return data
      })
      .then(setCatalog)
      .catch((cause: unknown) => {
        if (controller.signal.aborted && controller.signal.reason?.name !== 'TimeoutError') return
        setError(cause instanceof Error ? cause.message : '连接失败，请检查网络后重试')
      }).finally(() => clearTimeout(timeout))
    return () => { clearTimeout(timeout); controller.abort() }
  }, [attempt])
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#17191d' : '#f8f9fb')
    }
    apply(); media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
  const toggleFavorite = useCallback((id: string) => {
    setFavorites(previous => previous.includes(id) ? previous.filter(value => value !== id) : [id, ...previous].slice(0, 200))
  }, [setFavorites])
  const recordVisit = useCallback((id: string) => setRecent(previous => [id, ...previous.filter(value => value !== id)].slice(0, 24)), [setRecent])
  const clearRecent = useCallback(() => { setRecent([]); toast.success('最近打开记录已清空') }, [setRecent])
  const value = useMemo(() => ({ catalog, error, reload: () => setAttempt(n => n + 1), favorites, toggleFavorite, recent, recordVisit, clearRecent, theme, setTheme }), [catalog, error, favorites, toggleFavorite, recent, recordVisit, clearRecent, theme, setTheme])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const state = useContext(AppContext)
  if (!state) throw new Error('AppProvider is missing')
  return state
}

function isCatalog(value: unknown): value is Catalog {
  if (!value || typeof value !== 'object') return false
  const c = value as Catalog
  return c.version === 1 && Array.isArray(c.categories) && Array.isArray(c.tools) &&
    c.categories.every(v => typeof v.id === 'string' && typeof v.title === 'string' && typeof v.tone === 'string' && typeof v.icon === 'string') &&
    c.tools.every(v => typeof v.id === 'string' && typeof v.title === 'string' && typeof v.shortDesc === 'string' && Array.isArray(v.tags) && v.tags.every(tag => typeof tag === 'string') && typeof v.icon === 'string' && ['available', 'planned'].includes(v.status) && c.categories.some(category => category.id === v.categoryId))
}
