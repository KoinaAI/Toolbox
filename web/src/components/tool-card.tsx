import { Link } from 'react-router-dom'
import { Card, Chip } from '@heroui/react'
import { ItemCard } from '@heroui-pro/react/item-card'
import type { Tool, Category } from '../lib/types'
import { useApp } from '../lib/providers'
import { Icon } from './icon'
import { IconButton } from './controls'

export function ToolCard({ tool, category, layout = 'grid', featured = false }: { tool: Tool; category: Category; layout?: 'grid' | 'list'; featured?: boolean }) {
  const { favorites, toggleFavorite } = useApp()
  const saved = favorites.includes(tool.id)
  const favorite = <IconButton label={saved ? `取消收藏${tool.title}` : `收藏${tool.title}`} icon={saved ? 'StarFill' : 'Star'} active={saved} aria-pressed={saved} onPress={() => toggleFavorite(tool.id)} className="favorite-action" />
  if (layout === 'list') return <ItemCard variant="transparent" className="tool-row">
    <ItemCard.Icon className={`tool-icon tone-${category.tone}`}><Icon name={tool.icon} size={22} /></ItemCard.Icon>
    <ItemCard.Content><ItemCard.Title><Link className="tool-title-link" to={`/tools/${tool.id}`}>{tool.title}</Link></ItemCard.Title><ItemCard.Description>{tool.shortDesc}</ItemCard.Description></ItemCard.Content>
    <span className="row-category">{category.title}</span><span className="row-status">待接入</span><ItemCard.Action>{favorite}</ItemCard.Action>
  </ItemCard>
  return <Card className={`tool-card ${featured ? 'featured-tool-card' : ''}`}>
    <Card.Header className="tool-card-top"><span className={`tool-icon tone-${category.tone}`}><Icon name={tool.icon} size={22} /></span>{favorite}</Card.Header>
    <Card.Content className="tool-card-content"><Card.Title><Link className="tool-title-link" to={`/tools/${tool.id}`}>{tool.title}</Link></Card.Title><Card.Description>{tool.shortDesc}</Card.Description></Card.Content>
    <Card.Footer className="tool-card-footer"><Chip size="sm" variant="soft" className="category-label">{category.title}</Chip><span className="tool-card-trailing"><span>待接入</span><Icon name="ArrowUpRight" size={15} /></span></Card.Footer>
  </Card>
}
