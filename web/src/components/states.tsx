import { Button, Skeleton } from '@heroui/react'
import { EmptyState } from '@heroui-pro/react/empty-state'
import { Link } from 'react-router-dom'
import { Icon } from './icon'

export function BlankState({
  icon = 'Search',
  title,
  description,
  action,
  onAction,
}: {
  icon?: string
  title: string
  description: string
  action?: string
  onAction?: () => void
}) {
  return (
    <EmptyState className="blank-state">
      <EmptyState.Header>
        <EmptyState.Media variant="icon">
          <Icon name={icon} size={26} className="text-accent" />
        </EmptyState.Media>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description>{description}</EmptyState.Description>
      </EmptyState.Header>
      {action && (
        <EmptyState.Content>
          <Button variant="secondary" onPress={onAction}>
            {action}
          </Button>
        </EmptyState.Content>
      )}
    </EmptyState>
  )
}
export function CatalogLoading() {
  return (
    <div aria-label="正在加载工具目录" aria-busy="true" className="space-y-7">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-7 w-36 rounded-lg" />
      <div className="tools-grid">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
export function NotFound({ tool = false }: { tool?: boolean }) {
  return (
    <div className="not-found">
      <span className="error-number">404</span>
      <BlankState
        icon="Folder"
        title={tool ? '这个工具还没放进箱子' : '这里好像空空的'}
        description="链接可能有误，也可能页面已经搬走。回到工具箱重新找找吧。"
      />
      <Link to="/" className="inline-link">
        返回工具箱 <Icon name="ArrowRight" size={16} />
      </Link>
    </div>
  )
}
