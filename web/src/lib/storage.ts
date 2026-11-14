import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

type Updater<T> = T | ((previous: T) => T)
let warned = false

/** Persists a validated preference, gracefully degrading to memory-only state. */
export function usePreference<T>(
  key: string,
  initial: T,
  validate: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw)
        if (validate(parsed)) return parsed
      }
    } catch {
      /* Disabled storage and old malformed preferences fall back safely. */
    }
    return initial
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      if (!warned) {
        warned = true
        toast.info('浏览器存储不可用，偏好仅在本次打开期间保留。')
      }
    }
  }, [key, value])
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== key && event.key !== null) return
      try {
        const next: unknown =
          event.newValue === null ? initial : JSON.parse(event.newValue)
        if (validate(next)) setValue(next)
      } catch {
        /* Ignore malformed changes from another tab. */
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [key, initial, validate])
  const update = useCallback((next: Updater<T>) => setValue(next), [])
  return [value, update] as const
}

export const EMPTY_IDS: string[] = []
export const validIds = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= 200 &&
  value.every((id) => typeof id === 'string' && /^[a-z0-9-]{1,80}$/.test(id)) &&
  new Set(value).size === value.length
export type Theme = 'light' | 'dark' | 'system'
export const validTheme = (value: unknown): value is Theme =>
  value === 'light' || value === 'dark' || value === 'system'
