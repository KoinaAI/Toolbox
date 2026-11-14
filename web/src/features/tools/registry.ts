import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { Tool } from '../../lib/types'

/** Each executable tool receives only its metadata; it owns its input/output and API calls. */
export interface ToolWorkspaceProps {
  tool: Tool
}
type Loader = () => Promise<{ default: ComponentType<ToolWorkspaceProps> }>

const loaders: Record<string, Loader> = {
  color: () => import('./modules/color'),
  base64: () => import('./modules/base64'),
  'number-base': () => import('./modules/base64').then(module => ({ default: module.NumberBase })),
  'id-card': () => import('./modules/text').then(module => ({ default: module.Identity })),
  jwt: () => import('./modules/text').then(module => ({ default: module.JWT })),
  'word-count': () => import('./modules/text').then(module => ({ default: module.WordCount })),
}
const modules = new Map<
  string,
  LazyExoticComponent<ComponentType<ToolWorkspaceProps>>
>()

/** A metadata flag alone must never advertise a missing implementation as usable. */
export function isToolAvailable(tool: Tool) {
  return tool.status === 'available' && Boolean(loaders[tool.id])
}

/** Resolves an optional implementation without bundling every tool into the application shell. */
export function getToolModule(id: string) {
  if (!loaders[id]) return null
  if (!modules.has(id)) modules.set(id, lazy(loaders[id]))
  return modules.get(id)!
}
