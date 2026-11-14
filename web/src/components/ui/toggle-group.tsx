// Adapted from shadcn/ui (MIT). Shared tokens keep this Radix control aligned with HeroUI.
import { ToggleGroup as Primitive } from 'radix-ui'
import { cva } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

const itemVariants = cva(
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm disabled:pointer-events-none disabled:opacity-50',
)
export function ToggleGroup({
  className,
  ...props
}: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      data-slot="toggle-group"
      className={cn(
        'inline-flex w-fit items-center gap-0.5 rounded-xl bg-surface-secondary p-1',
        className,
      )}
      {...props}
    />
  )
}
export function ToggleGroupItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      data-slot="toggle-group-item"
      className={cn(itemVariants(), className)}
      {...props}
    />
  )
}
