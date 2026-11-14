import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from '@heroui-pro/react/command'
import { useApp } from '../lib/providers'
import { Icon } from './icon'
import { Shortcut } from './controls'

export function CommandPalette({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const { catalog, setTheme } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const go = (href: string) => { navigate(href); onOpenChange(false); setSearch('') }
  return <Command>
    <Command.Backdrop isOpen={isOpen} onOpenChange={open => { onOpenChange(open); if (!open) setSearch('') }} variant="blur">
      <Command.Container size="lg">
        <Command.Dialog aria-label="快速查找工具" inputValue={search} onInputChange={setSearch} filter={(text, input) => input.toLowerCase().trim().split(/\s+/).every(term => text.toLowerCase().includes(term))}>
          <Command.InputGroup aria-label="搜索工具或页面"><Command.InputGroup.Prefix><Icon name="Search" /></Command.InputGroup.Prefix><Command.InputGroup.Input placeholder="搜索工具、分类或操作…" maxLength={128} /><Command.InputGroup.Suffix><Shortcut>Esc</Shortcut></Command.InputGroup.Suffix></Command.InputGroup>
          <Command.List aria-label="搜索结果" renderEmptyState={() => <div className="px-6 py-10 text-center text-sm text-muted">没有找到相关工具，换个关键词试试。</div>}>
            <Command.Group heading="工具">{catalog?.tools.map(tool => {
              const category = catalog.categories.find(c => c.id === tool.categoryId)!
              return <Command.Item key={tool.id} id={`tool-${tool.id}`} textValue={`${tool.title} ${tool.shortDesc} ${tool.tags.join(' ')} ${category.title}`} onAction={() => go(`/tools/${tool.id}`)}><span className={`command-tool-icon tone-${category.tone}`}><Icon name={tool.icon} size={18} /></span><span className="min-w-0 flex-1 truncate">{tool.title}</span><span className="text-xs text-muted">{category.title}</span></Command.Item>
            })}</Command.Group>
            <Command.Group heading="页面与操作">
              <Command.Item id="all" textValue="发现工具 全部 首页" onAction={() => go('/')}><Icon name="Grid" size={18} />发现工具</Command.Item>
              <Command.Item id="favorites" textValue="我的收藏 favorites" onAction={() => go('/favorites')}><Icon name="Star" size={18} />我的收藏</Command.Item>
              <Command.Item id="recent" textValue="最近打开 history" onAction={() => go('/recent')}><Icon name="History" size={18} />最近打开</Command.Item>
              <Command.Item id="theme" textValue="跟随系统 外观 主题 theme" onAction={() => { setTheme('system'); onOpenChange(false) }}><Icon name="Monitor" size={18} />外观跟随系统</Command.Item>
            </Command.Group>
          </Command.List>
          <Command.Footer><span className="flex gap-3"><span><Shortcut>↑ ↓</Shortcut> 选择</span><span><Shortcut>↵</Shortcut> 打开</span></span><span>随时按 <Shortcut>⌘ / Ctrl K</Shortcut> 唤出</span></Command.Footer>
        </Command.Dialog>
      </Command.Container>
    </Command.Backdrop>
  </Command>
}
