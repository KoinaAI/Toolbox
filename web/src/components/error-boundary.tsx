import { Component, type ReactNode } from 'react'
import { Button } from '@heroui/react'

/** Keeps a broken future tool module from taking down the directory shell. */
export class ErrorBoundary extends Component<{ children: ReactNode; compact?: boolean }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <div role="alert" className={`error-fallback ${this.props.compact ? '' : 'min-h-screen'}`}><h1>这里遇到了一点小问题</h1><p>请重新加载页面，或者稍后再试。</p><Button onPress={() => window.location.reload()}>重新加载</Button></div>
  }
}
