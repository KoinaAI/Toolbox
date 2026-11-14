import { useDeferredValue, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, Dropdown, InputGroup, TextField } from '@heroui/react'
import { Segment } from '@heroui-pro/react/segment'
import { motion } from 'motion/react'
import { useApp } from '../../lib/providers'
import { usePreference } from '../../lib/storage'
import { Icon } from '../../components/icon'
import { IconButton } from '../../components/controls'
import { ToolCard } from '../../components/tool-card'
import { BlankState, CatalogLoading, NotFound } from '../../components/states'
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group'
import type { Tool } from '../../lib/types'

type Layout = 'grid' | 'list'
const isLayout = (value: unknown): value is Layout =>
  value === 'grid' || value === 'list'
const sorts = { recommended: '默认排序', title: '名称排序', newest: '最近收录' }

export function CatalogPage({
  view = 'all',
}: {
  view?: 'all' | 'category' | 'favorites' | 'recent'
}) {
  const { categoryId } = useParams()
  const { catalog, error, reload, favorites, recent, clearRecent } = useApp()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [layout, setLayout] = usePreference<Layout>(
    'toolbox.layout',
    'grid',
    isLayout,
  )
  const query = params.get('q')?.slice(0, 128) || ''
  const deferredQuery = useDeferredValue(query)
  const selectedTab = params.get('tab') === 'featured' ? 'featured' : 'all'
  const sort =
    params.get('sort') && Object.hasOwn(sorts, params.get('sort')!)
      ? (params.get('sort')! as keyof typeof sorts)
      : 'recommended'
  const category = catalog?.categories.find((c) => c.id === categoryId)
  const setParam = (key: string, value: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  const tools = useMemo(() => {
    if (!catalog) return []
    let result = catalog.tools.filter((tool) =>
      view === 'category'
        ? tool.categoryId === categoryId
        : view === 'favorites'
          ? favorites.includes(tool.id)
          : view === 'recent'
            ? recent.includes(tool.id)
            : true,
    )
    if (selectedTab === 'featured') result = result.filter((t) => t.featured)
    const terms = deferredQuery
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter(Boolean)
    result = result.filter((tool) =>
      terms.every((term) =>
        `${tool.title} ${tool.shortDesc} ${tool.tags.join(' ')} ${catalog.categories.find((c) => c.id === tool.categoryId)?.title}`
          .toLocaleLowerCase()
          .includes(term),
      ),
    )
    if (sort === 'title')
      result.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
    else if (sort === 'newest')
      result.sort(
        (a, b) => b.addedAt.localeCompare(a.addedAt) || a.order - b.order,
      )
    else if (view === 'favorites' || view === 'recent') {
      const ids = view === 'favorites' ? favorites : recent
      result.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    } else
      result.sort(
        (a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order,
      )
    return result
  }, [
    catalog,
    view,
    categoryId,
    favorites,
    recent,
    selectedTab,
    deferredQuery,
    sort,
  ])
  if (error)
    return (
      <BlankState
        icon="Unplug"
        title="工具箱暂时没连上"
        description={error}
        action="重新加载"
        onAction={reload}
      />
    )
  if (!catalog) return <CatalogLoading />
  if (view === 'category' && !category) return <NotFound />
  const title =
    category?.title ||
    (view === 'favorites'
      ? '把顺手的，留在身边。'
      : view === 'recent'
        ? '接着上次，继续探索。'
        : '')
  const description =
    category?.description ||
    (view === 'favorites'
      ? '属于你的常用工具，点击星标就能收藏到这里。'
      : '最近打开的工具会留在这里，仅保存在当前浏览器。')
  const total = catalog.tools.filter((t) =>
    view === 'category'
      ? t.categoryId === categoryId
      : view === 'favorites'
        ? favorites.includes(t.id)
        : view === 'recent'
          ? recent.includes(t.id)
          : true,
  ).length
  const search = (
    <TextField
      aria-label="搜索工具"
      value={query}
      onChange={(value) => setParam('q', value)}
      className="catalog-search"
      name="q"
    >
      <InputGroup fullWidth>
        <InputGroup.Prefix>
          <Icon name="Search" size={21} />
        </InputGroup.Prefix>
        <InputGroup.Input
          id="catalog-search"
          placeholder="搜索工具，试试 JSON、Base64、时间戳…"
          maxLength={128}
          autoComplete="off"
        />
        {query && (
          <InputGroup.Suffix>
            <IconButton
              label="清空搜索"
              icon="Close"
              onPress={() => {
                setParam('q', '')
                document.getElementById('catalog-search')?.focus()
              }}
            />
          </InputGroup.Suffix>
        )}
      </InputGroup>
    </TextField>
  )
  return (
    <motion.div
      initial={{ opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      {view === 'all' ? (
        <section className="welcome" aria-labelledby="welcome-title">
          <div className="welcome-content">
            <span className="welcome-eyebrow">
              <span />
              为日常，准备一点小帮手
            </span>
            <h1 id="welcome-title">
              小工具，<span>刚刚好。</span>
            </h1>
            <p>开发、设计、生活里的琐事，都有更顺手的解法。</p>
            {search}
            <div className="search-suggestions">
              <span>不妨试试</span>
              {['JSON', 'Base64', '时间戳', '颜色'].map((value) => (
                <button key={value} onClick={() => setParam('q', value)}>
                  {value}
                  <Icon name="ArrowUpRight" size={12} />
                </button>
              ))}
            </div>
          </div>
          <WorkbenchArt />
        </section>
      ) : (
        <section className="collection-header">
          <div className="collection-heading">
            <span
              className={`collection-icon tone-${category?.tone || 'orange'}`}
            >
              <Icon
                name={
                  category?.icon || (view === 'favorites' ? 'Star' : 'History')
                }
                size={27}
              />
            </span>
            <div>
              <span className="collection-eyebrow">
                {category ? '按分类探索' : '我的工作台'}
              </span>
              <h1>{title}</h1>
            </div>
            {view === 'recent' && total > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="clear-recent"
                onPress={clearRecent}
              >
                <Icon name="Trash" size={15} />
                清空记录
              </Button>
            )}
          </div>
          <p>{description}</p>
          {search}
        </section>
      )}
      <section className="directory" aria-label="工具目录">
        <div className="directory-toolbar">
          <Segment
            aria-label="工具范围"
            selectedKey={selectedTab}
            onSelectionChange={(key) =>
              setParam('tab', key === 'all' ? '' : String(key))
            }
            variant="ghost"
            className="catalog-segments"
          >
            <Segment.Item id="all">
              {view === 'favorites'
                ? '已收藏'
                : view === 'recent'
                  ? '最近打开'
                  : '全部工具'}
              <span className="segment-count">{total}</span>
            </Segment.Item>
            <Segment.Item id="featured">
              <Icon name="Sparkles" size={15} />
              编辑精选
            </Segment.Item>
          </Segment>
          <div className="directory-display-controls">
            <Dropdown>
              <Button variant="ghost" size="sm" className="sort-trigger">
                <Icon name="ListFilter" size={15} />
                {sorts[sort]}
                <Icon name="ChevronDown" size={13} />
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  aria-label="工具排序"
                  selectionMode="single"
                  selectedKeys={new Set([sort])}
                  onAction={(key) => setParam('sort', String(key))}
                >
                  {Object.entries(sorts).map(([id, label]) => (
                    <Dropdown.Item id={id} key={id} textValue={label}>
                      {label}
                      <Dropdown.ItemIndicator />
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
            <ToggleGroup
              type="single"
              value={layout}
              onValueChange={(value) => {
                if (isLayout(value)) setLayout(value)
              }}
              aria-label="目录显示方式"
            >
              <ToggleGroupItem value="grid" aria-label="卡片视图">
                <Icon name="Grid" size={14} />
                <span>卡片</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="列表视图">
                <Icon name="List" size={15} />
                <span>列表</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        {(view === 'all' || view === 'category') && (
          <nav className="category-filters" aria-label="筛选分类">
            <Link
              className={`category-filter ${view === 'all' ? 'is-active' : ''}`}
              to={`/${params.size ? `?${params}` : ''}`}
              aria-current={view === 'all' ? 'page' : undefined}
            >
              全部分类
            </Link>
            {catalog.categories.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.id}${params.size ? `?${params}` : ''}`}
                className={`category-filter ${categoryId === c.id ? 'is-active' : ''}`}
                aria-current={categoryId === c.id ? 'page' : undefined}
              >
                {c.title}
              </Link>
            ))}
          </nav>
        )}
        <div className="catalog-summary">
          <p role="status" aria-live="polite">
            {query ? (
              <>
                找到 <strong>{tools.length}</strong> 个与「{query}」相关的工具
              </>
            ) : (
              <>
                共 <strong>{tools.length}</strong> 个工具
                <span>，总有一个刚好用得上</span>
              </>
            )}
          </p>
        </div>
        {tools.length ? (
          <div
            className={layout === 'grid' ? 'tools-grid' : 'tools-list'}
            aria-label="工具列表"
          >
            {tools.map((tool: Tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                category={catalog.categories.find(
                  (c) => c.id === tool.categoryId,
                )!}
                layout={layout}
              />
            ))}
          </div>
        ) : (
          <BlankState
            icon={query ? 'Search' : view === 'favorites' ? 'Star' : 'History'}
            title={
              query
                ? '换个关键词，也许就在下一次'
                : view === 'favorites'
                  ? '你的收藏夹，等着第一件工具'
                  : view === 'recent'
                    ? '还没有打开过工具'
                    : '这里暂时还没有工具'
            }
            description={
              query
                ? '试着缩短关键词，或者切换到全部分类再找找。'
                : view === 'favorites'
                  ? '点击工具卡片上的星标，把喜欢的工具收进来。'
                  : view === 'recent'
                    ? '打开任意工具，它就会出现在这里。'
                    : '试试取消筛选，探索其他好用的小工具。'
            }
            action={query || selectedTab !== 'all' ? '重置筛选' : '去发现工具'}
            onAction={() => {
              if (query || selectedTab !== 'all')
                setParams({}, { replace: true })
              else navigate('/')
            }}
          />
        )}
      </section>
      <div className="directory-bottom">
        <Icon name="Smile" size={16} />
        <p>工具有点杂，心意很简单。希望能帮上你的小忙。</p>
        <Link to="/about">
          认识工具箱 <Icon name="ArrowRight" size={14} />
        </Link>
      </div>
    </motion.div>
  )
}

function WorkbenchArt() {
  return (
    <div className="workbench-art" aria-hidden="true">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <span className="art-dot dot-one" />
      <span className="art-dot dot-two" />
      <div className="art-tile art-tile-code">
        <Icon name="Braces" size={37} />
      </div>
      <div className="art-tile art-tile-color">
        <span />
        <span />
        <span />
      </div>
      <div className="art-tile art-tile-text">
        <span>
          A<span>a</span>
        </span>
      </div>
      <div className="art-tile art-tile-binary">
        <span>
          01
          <br />
          10
        </span>
      </div>
      <div className="art-toolbox">
        <div className="art-toolbox-handle" />
        <div className="art-toolbox-top">
          <span />
          <span />
        </div>
        <div className="art-toolbox-bottom">
          <div className="art-toolbox-lock" />
        </div>
      </div>
      <span className="art-spark spark-one">✦</span>
      <span className="art-spark spark-two">✦</span>
      <span className="art-ground" />
    </div>
  )
}
