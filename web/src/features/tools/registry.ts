import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { Tool } from '../../lib/types'

/** Each executable tool receives only its metadata; it owns its input/output and API calls. */
export interface ToolWorkspaceProps { tool: Tool }
type Loader = () => Promise<{ default: ComponentType<ToolWorkspaceProps> }>

// Add an explicit lazy import here when an implementation is ready. No module is executable yet.
const loaders: Record<string, Loader> = {}
const modules = new Map<string, LazyExoticComponent<ComponentType<ToolWorkspaceProps>>>()

/** Resolves an optional implementation without bundling every tool into the application shell. */
export function getToolModule(id: string) {
  if (!loaders[id]) return null
  if (!modules.has(id)) modules.set(id, lazy(loaders[id]))
  return modules.get(id)!
}
