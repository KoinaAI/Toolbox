import { Suspense, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, Chip, Skeleton } from '@heroui/react'
import { ItemCard } from '@heroui-pro/react/item-card'
import { toast } from 'sonner'
import { useApp } from '../../lib/providers'
import { Icon } from '../../components/icon'
import { IconButton } from '../../components/controls'
import { BlankState, CatalogLoading, NotFound } from '../../components/states'
import { ToolCard } from '../../components/tool-card'
import { getToolModule, isToolAvailable } from './registry'
import { ErrorBoundary } from '../../components/error-boundary'

export function ToolPage() {
  const { toolId } = useParams()
  const { catalog, error, reload, favorites, toggleFavorite, recordVisit } =
    useApp()
  const tool = catalog?.tools.find((t) => t.id === toolId)
  useEffect(() => {
    if (tool) recordVisit(tool.id)
  }, [tool, recordVisit])
  if (error)
    return (
      <BlankState
        icon="Unplug"
        title="工具信息暂时不可用"
        description={error}
        action="重试"
        onAction={reload}
      />
    )
  if (!catalog) return <CatalogLoading />
  if (!tool) return <NotFound tool />
  const category = catalog.categories.find((c) => c.id === tool.categoryId)!
  const saved = favorites.includes(tool.id)
  const Module = getToolModule(tool.id)
  const serverSide = [
    'dns',
    'ip',
    'http-client',
    'image-compress',
    'image-convert',
    'image-resize',
  ].includes(tool.id)
  const available = isToolAvailable(tool)
  const related = catalog.tools
    .filter((t) => t.categoryId === category.id && t.id !== tool.id)
    .slice(0, 3)
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('工具链接已复制')
    } catch {
      toast.error('暂时无法复制，请从浏览器地址栏复制链接')
    }
  }
  return (
    <div>
      <nav className="tool-breadcrumb" aria-label="当前位置">
        <Link to="/">工具箱</Link>
        <Icon name="ChevronRight" size={12} />
        <Link to={`/category/${category.id}`}>{category.title}</Link>
        <Icon name="ChevronRight" size={12} />
        <span aria-current="page">{tool.title}</span>
      </nav>
      <div className="tool-page-heading">
        <span className={`detail-tool-icon tone-${category.tone}`}>
          <Icon name={tool.icon} size={29} />
        </span>
        <div>
          <h1>{tool.title}</h1>
          <p>{tool.shortDesc}</p>
        </div>
        <div className="tool-page-actions">
          <Button
            variant={saved ? 'secondary' : 'outline'}
            size="sm"
            aria-pressed={saved}
            onPress={() => toggleFavorite(tool.id)}
          >
            <Icon name={saved ? 'StarFill' : 'Star'} size={16} />
            {saved ? '已收藏' : '收藏工具'}
          </Button>
          <IconButton label="复制工具链接" icon="Link" onPress={copyLink} />
        </div>
      </div>
      <div className="tool-detail-layout">
        <div className="tool-main-panel">
          <Card className="workspace-card">
            <Card.Header className="workspace-heading">
              <Card.Title>工作区</Card.Title>
              <Chip size="sm" variant="soft" color="default">
                {serverSide ? '服务器处理' : '浏览器内处理'}
              </Chip>
            </Card.Header>
            <Card.Content className="workspace-content">
              {available && Module ? (
                <ErrorBoundary key={tool.id} compact>
                  <Suspense
                    fallback={<Skeleton className="h-72 w-full rounded-2xl" />}
                  >
                    <Module tool={tool} />
                  </Suspense>
                </ErrorBoundary>
              ) : (
                <BlankState
                  icon="Unplug"
                  title="工具暂时不可用"
                  description="工具模块未能加载，请刷新页面重试。"
                  action="刷新"
                  onAction={() => window.location.reload()}
                />
              )}
            </Card.Content>
          </Card>
        </div>
        <aside className="tool-aside">
          <div className="tool-aside-heading">工具信息</div>
          <dl>
            <div>
              <dt>所属分类</dt>
              <dd>
                <Link to={`/category/${category.id}`}>
                  {category.title}
                  <Icon name="ArrowUpRight" size={12} />
                </Link>
              </dd>
            </div>
            <div>
              <dt>处理位置</dt>
              <dd>{serverSide ? '服务器' : '当前浏览器'}</dd>
            </div>
            <div>
              <dt>收录日期</dt>
              <dd className="tabular-nums">{tool.addedAt}</dd>
            </div>
          </dl>
          <ItemCard variant="transparent" className="detail-note">
            <ItemCard.Icon>
              <Icon name="Info" size={19} className="text-accent" />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>数据由你掌握</ItemCard.Title>
              <ItemCard.Description>
                每个工具会说明处理位置；收藏和最近记录仅在本机保存。
              </ItemCard.Description>
            </ItemCard.Content>
          </ItemCard>
          <a
            href="https://github.com/KoinaAI/Toolbox/issues/new"
            target="_blank"
            rel="noreferrer"
            className="inline-link"
          >
            有建议？告诉我们 <Icon name="ArrowUpRight" size={14} />
          </a>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="related-tools">
          <div className="section-heading">
            <h2>同一个抽屉里的工具</h2>
            <Link to={`/category/${category.id}`}>
              查看全部 <Icon name="ArrowRight" size={14} />
            </Link>
          </div>
          <div className="tools-grid">
            {related.map((item) => (
              <ToolCard key={item.id} tool={item} category={category} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
