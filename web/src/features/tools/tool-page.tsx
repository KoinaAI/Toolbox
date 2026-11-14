import { Suspense, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Accordion, Button, Card, Chip, Skeleton, Tabs } from '@heroui/react'
import { ItemCard } from '@heroui-pro/react/item-card'
import { toast } from 'sonner'
import { useApp } from '../../lib/providers'
import { Icon } from '../../components/icon'
import { IconButton } from '../../components/controls'
import { BlankState, CatalogLoading, NotFound } from '../../components/states'
import { ToolCard } from '../../components/tool-card'
import { getToolModule } from './registry'
import { ErrorBoundary } from '../../components/error-boundary'

export function ToolPage() {
  const { toolId } = useParams()
  const { catalog, error, reload, favorites, toggleFavorite, recordVisit } = useApp()
  const tool = catalog?.tools.find(t => t.id === toolId)
  useEffect(() => { if (tool) recordVisit(tool.id) }, [tool, recordVisit])
  if (error) return <BlankState icon="Unplug" title="工具信息暂时不可用" description={error} action="重试" onAction={reload} />
  if (!catalog) return <CatalogLoading />
  if (!tool) return <NotFound tool />
  const category = catalog.categories.find(c => c.id === tool.categoryId)!
  const saved = favorites.includes(tool.id)
  const Module = getToolModule(tool.id)
  const available = tool.status === 'available' && Module !== null
  const related = catalog.tools.filter(t => t.categoryId === category.id && t.id !== tool.id).slice(0, 3)
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); toast.success('工具链接已复制') } catch { toast.error('暂时无法复制，请从浏览器地址栏复制链接') } }
  return <div>
    <nav className="tool-breadcrumb" aria-label="当前位置"><Link to="/">工具箱</Link><Icon name="ChevronRight" size={12} /><Link to={`/category/${category.id}`}>{category.title}</Link><Icon name="ChevronRight" size={12} /><span aria-current="page">{tool.title}</span></nav>
    <div className="tool-page-heading"><span className={`detail-tool-icon tone-${category.tone}`}><Icon name={tool.icon} size={29} /></span><div><h1>{tool.title}</h1><p>{tool.shortDesc}</p></div><div className="tool-page-actions"><Button variant={saved ? 'secondary' : 'outline'} size="sm" aria-pressed={saved} onPress={() => toggleFavorite(tool.id)}><Icon name={saved ? 'StarFill' : 'Star'} size={16} />{saved ? '已收藏' : '收藏工具'}</Button><IconButton label="复制工具链接" icon="Link" onPress={copyLink} /></div></div>
    <div className="tool-detail-layout"><div className="tool-main-panel">
      <Card className="workspace-card"><Card.Header className="workspace-heading"><Card.Title>工作区</Card.Title><Chip size="sm" variant="soft" color={available ? 'success' : 'default'}>{available ? '已接入' : '待接入'}</Chip></Card.Header><Card.Content className="workspace-content">
        {available && Module ? <ErrorBoundary key={tool.id} compact><Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}><Module tool={tool} /></Suspense></ErrorBoundary> : <div className="planned-workspace"><div className="planned-graphic"><Icon name={tool.icon} size={32} /><span><Icon name="Clock3" size={14} /></span></div><Chip size="sm" variant="soft">已经安排，敬请期待</Chip><h2>好工具，值得认真打磨。</h2><p>这里将是「{tool.title}」的专属工作区。<br />当前已完成页面与目录，具体功能尚未接入。</p><Button variant="secondary" onPress={() => { if (!saved) toggleFavorite(tool.id); toast.success('已加入收藏，方便下次找到它') }}><Icon name="Star" size={16} />{saved ? '已在我的收藏中' : '先收藏，留着下次用'}</Button><Link to={`/category/${category.id}`} className="back-to-explore">看看同类工具 <Icon name="ArrowRight" size={14} /></Link></div>}
      </Card.Content></Card>
      <Tabs aria-label="工具说明" className="tool-info-tabs" defaultSelectedKey="intro"><Tabs.ListContainer><Tabs.List><Tabs.Tab id="intro">工具介绍<Tabs.Indicator /></Tabs.Tab><Tabs.Tab id="notes">使用说明<Tabs.Indicator /></Tabs.Tab></Tabs.List></Tabs.ListContainer>
        <Tabs.Panel id="intro"><h2>关于 {tool.title}</h2><p>{tool.shortDesc}。这个工具归属于「{category.title}」分类，目前处于目录收录阶段。</p><p>本次版本优先完善站点结构与浏览体验，后续接入独立工具模块后，将在上方呈现实际的输入与结果界面。</p><div className="tool-tags">{tool.tags.map(tag => <Chip key={tag} size="sm" variant="soft">{tag}</Chip>)}</div></Tabs.Panel>
        <Tabs.Panel id="notes"><Accordion><Accordion.Item id="availability"><Accordion.Heading><Accordion.Trigger>现在可以使用这个工具吗？<Accordion.Indicator /></Accordion.Trigger></Accordion.Heading><Accordion.Panel>当前版本提供目录、收藏与工具页面，尚未实现这个工具的实际处理功能。接入后会更新工作区状态。</Accordion.Panel></Accordion.Item><Accordion.Item id="storage"><Accordion.Heading><Accordion.Trigger>收藏和最近记录保存在哪里？<Accordion.Indicator /></Accordion.Trigger></Accordion.Heading><Accordion.Panel>仅保存在当前浏览器，不会同步到服务器。清除网站数据或切换浏览器后，这些记录不会保留。</Accordion.Panel></Accordion.Item></Accordion></Tabs.Panel>
      </Tabs>
    </div><aside className="tool-aside"><div className="tool-aside-heading">工具信息</div><dl><div><dt>所属分类</dt><dd><Link to={`/category/${category.id}`}>{category.title}<Icon name="ArrowUpRight" size={12} /></Link></dd></div><div><dt>接入状态</dt><dd>{available ? '已接入' : '计划中'}</dd></div><div><dt>收录日期</dt><dd className="tabular-nums">{tool.addedAt}</dd></div></dl><ItemCard variant="transparent" className="detail-note"><ItemCard.Icon><Icon name="Info" size={19} className="text-accent" /></ItemCard.Icon><ItemCard.Content><ItemCard.Title>数据由你掌握</ItemCard.Title><ItemCard.Description>目录浏览无需登录，个人偏好仅在本地保存。</ItemCard.Description></ItemCard.Content></ItemCard><a href="https://github.com/KoinaAI/Toolbox/issues/new" target="_blank" rel="noreferrer" className="inline-link">有建议？告诉我们 <Icon name="ArrowUpRight" size={14} /></a></aside></div>
    <section className="related-tools"><div className="section-heading"><h2>同一个抽屉里的工具</h2><Link to={`/category/${category.id}`}>查看全部 <Icon name="ArrowRight" size={14} /></Link></div><div className="tools-grid">{related.map(item => <ToolCard key={item.id} tool={item} category={category} />)}</div></section>
  </div>
}
