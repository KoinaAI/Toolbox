export interface Category {
  id: string
  title: string
  icon: string
  tone: string
  description: string
  order: number
}
export interface Tool {
  id: string
  categoryId: string
  title: string
  shortDesc: string
  icon: string
  tags: string[]
  status: 'available'
  featured: boolean
  addedAt: string
  order: number
}
export interface Catalog {
  version: number
  categories: Category[]
  tools: Tool[]
}
