import { Button, Tooltip } from '@heroui/react'
import type { ComponentProps, ReactNode } from 'react'
import { Icon } from './icon'

type IconButtonProps = Omit<ComponentProps<typeof Button>, 'children'> & {
  label: string
  icon: string
  active?: boolean
}
export function IconButton({
  label,
  icon,
  active,
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <Tooltip delay={400}>
      <Button
        isIconOnly
        variant="ghost"
        size="sm"
        aria-label={label}
        className={`${active ? 'text-accent' : 'text-muted'} ${className}`}
        {...props}
      >
        <Icon name={icon} size={18} />
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  )
}

export function Shortcut({ children }: { children: ReactNode }) {
  return <kbd className="shortcut">{children}</kbd>
}
