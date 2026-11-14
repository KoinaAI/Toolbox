import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Skeleton, Tooltip } from '@heroui/react'
import { Sidebar } from '@heroui-pro/react/sidebar'
import { useApp } from '../lib/providers'
import { Icon } from './icon'
import { Shortcut } from './controls'
import { ThemeMenu } from './theme-menu'
import { CommandPalette } from './command-palette'

function SidebarContents() {
  const { catalog, favorites, recent } = useApp()
  const { pathname } = useLocation()
  const links = [{ id: 'all', href: '/', label: '发现工具', icon: 'Grid', count: catalog?.tools.length }, { id: 'favorites', href: '/favorites', label: '我的收藏', icon: 'Star', count: favorites.filter(id => catalog?.tools.some(t => t.id === id)).length }, { id: 'recent', href: '/recent', label: '最近打开', icon: 'History', count: recent.filter(id => catalog?.tools.some(t => t.id === id)).length }]
  return <>
    <Sidebar.Header className="brand-header">
      <Link to="/" className="brand" aria-label="乱七八糟工具箱首页"><img src="/favicon.svg" width="38" height="38" alt="" /><span><strong>乱七八糟<span className="brand-dot">.</span></strong><small>一个顺手的工具箱</small></span></Link>
    </Sidebar.Header>
    <Sidebar.Content className="sidebar-scroll">
      <Sidebar.Group>
        <Sidebar.GroupLabel>工作台</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="工作台导航">{links.map(link => <Sidebar.MenuItem key={link.id} id={link.id} href={link.href} textValue={link.label} isCurrent={pathname === link.href}>
          <Sidebar.MenuIcon><Icon name={link.icon} size={18} /></Sidebar.MenuIcon><Sidebar.MenuLabel>{link.label}</Sidebar.MenuLabel><span className="nav-count">{link.count ?? '—'}</span>
        </Sidebar.MenuItem>)}</Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Group className="category-nav">
        <Sidebar.GroupLabel>工具分类 <span className="ml-auto text-[10px] tabular-nums">{catalog?.categories.length ?? 8}</span></Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="工具分类">{catalog ? catalog.categories.map(category => <Sidebar.MenuItem key={category.id} id={category.id} href={`/category/${category.id}`} textValue={category.title} isCurrent={pathname === `/category/${category.id}`}>
          <Sidebar.MenuIcon><Icon name={category.icon} size={18} /></Sidebar.MenuIcon><Sidebar.MenuLabel>{category.title}</Sidebar.MenuLabel><span className="nav-count">{catalog.tools.filter(t => t.categoryId === category.id).length}</span>
        </Sidebar.MenuItem>) : Array.from({ length: 8 }, (_, i) => <Sidebar.MenuItem id={`loading-${i}`} key={i} textValue="加载分类" isDisabled><Skeleton className="h-4 w-full rounded-md" /></Sidebar.MenuItem>)}</Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer className="sidebar-footer">
      <div className="sidebar-note"><div className="note-icon"><Icon name="Sparkles" size={18} /></div><strong>少一点折腾，多一点顺手。</strong><p>让小工具，解决大大小小的事。</p></div>
      <Sidebar.Menu aria-label="关于"><Sidebar.MenuItem id="about" href="/about" textValue="关于工具箱" isCurrent={pathname === '/about'}><Sidebar.MenuIcon><Icon name="Info" size={17} /></Sidebar.MenuIcon><Sidebar.MenuLabel>关于工具箱</Sidebar.MenuLabel><span className="nav-version">v0.1</span></Sidebar.MenuItem></Sidebar.Menu>
    </Sidebar.Footer>
  </>
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { catalog } = useApp()
  const [commandOpen, setCommandOpen] = useState(false)
  const category = catalog?.categories.find(c => location.pathname === `/category/${c.id}`)
  const tool = catalog?.tools.find(t => location.pathname === `/tools/${t.id}`)
  const page = category?.title || tool?.title || (location.pathname === '/favorites' ? '我的收藏' : location.pathname === '/recent' ? '最近打开' : location.pathname === '/about' ? '关于工具箱' : location.pathname === '/' ? '发现工具' : '页面未找到')
  useEffect(() => {
    document.title = `${page} · 乱七八糟工具箱`
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname, page])
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing) return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(previous => !previous) }
      const target = event.target as HTMLElement
      const editing = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if (event.key === '/' && !editing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        const search = document.querySelector<HTMLInputElement>('#catalog-search')
        if (search) search.focus(); else setCommandOpen(true)
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])
  return <Sidebar.Provider collapsible="none" toggleShortcut={false} navigate={navigate} className="app-frame">
    <a className="skip-link" href="#main-content">跳到主要内容</a>
    <Sidebar className="app-sidebar"><SidebarContents /></Sidebar>
    <Sidebar.Mobile className="app-mobile-sidebar"><SidebarContents /></Sidebar.Mobile>
    <div className="app-body">
      <header className="topbar">
        <div className="flex min-w-0 items-center gap-3">
          <Tooltip><Sidebar.Trigger aria-label="打开分类导航" className="mobile-nav-trigger"><Icon name="Menu" size={20} /></Sidebar.Trigger><Tooltip.Content>打开分类导航</Tooltip.Content></Tooltip>
          <Icon name="Grid" size={17} className="breadcrumb-home" /><span className="breadcrumb-separator">/</span><span className="truncate text-[13px] font-medium">{page}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="command-trigger" onPress={() => setCommandOpen(true)}><Icon name="Search" size={16} /><span>快速查找</span><Shortcut>⌘ K</Shortcut></Button>
          <span className="topbar-divider" />
          <ThemeMenu />
          <Tooltip delay={400}><a href="https://github.com/KoinaAI/Toolbox" target="_blank" rel="noreferrer" className="header-github" aria-label="在 GitHub 查看源码"><Icon name="Github" size={19} /></a><Tooltip.Content>在 GitHub 查看源码</Tooltip.Content></Tooltip>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="main-content"><Outlet /></main>
      <footer className="page-footer"><span>乱七八糟工具箱 <span className="footer-dot">·</span> 让日常，更顺手。</span><Link to="/about">用心整理，持续生长 <Icon name="ArrowUpRight" size={13} /></Link></footer>
    </div>
    <CommandPalette isOpen={commandOpen} onOpenChange={setCommandOpen} />
  </Sidebar.Provider>
}
