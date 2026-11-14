// shadcn/ui-style Sonner adapter; all colors come from the shared HeroUI tokens.
import { Toaster as Sonner } from 'sonner'
import { useApp } from '../../lib/providers'

export function Toaster() {
  const { theme } = useApp()
  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: '!bg-overlay !text-foreground !border-border !rounded-2xl',
          description: '!text-muted',
        },
      }}
    />
  )
}
