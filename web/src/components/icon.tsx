import { Icon as Iconify } from '@iconify/react'
import type { IconifyIcon } from '@iconify/react'
import icons from '../lib/icons.json'

export function Icon({
  name,
  className = '',
  size = 20,
}: {
  name: string
  className?: string
  size?: number
}) {
  const icon = (icons as Record<string, IconifyIcon>)[name] || icons['Code2']
  return (
    <Iconify
      icon={icon}
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    />
  )
}
