import { Button, Dropdown, Tooltip } from '@heroui/react'
import { useApp } from '../lib/providers'
import type { Theme } from '../lib/storage'
import { Icon } from './icon'

export function ThemeMenu() {
  const { theme, setTheme } = useApp()
  return <Dropdown>
    <Tooltip delay={400}>
      <Button isIconOnly size="sm" variant="ghost" aria-label="切换外观" className="text-muted"><Icon name={theme === 'dark' ? 'Moon' : theme === 'light' ? 'Sun' : 'Monitor'} size={19} /></Button>
      <Tooltip.Content>切换外观</Tooltip.Content>
    </Tooltip>
    <Dropdown.Popover placement="bottom end">
      <Dropdown.Menu aria-label="外观主题" selectionMode="single" selectedKeys={new Set([theme])} onAction={key => setTheme(key as Theme)}>
        <Dropdown.Item id="light" textValue="浅色"><Icon name="Sun" size={16} />浅色<Dropdown.ItemIndicator /></Dropdown.Item>
        <Dropdown.Item id="dark" textValue="深色"><Icon name="Moon" size={16} />深色<Dropdown.ItemIndicator /></Dropdown.Item>
        <Dropdown.Item id="system" textValue="跟随系统"><Icon name="Monitor" size={16} />跟随系统<Dropdown.ItemIndicator /></Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
}
