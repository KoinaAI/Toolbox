import { useId, useState, type ReactNode } from 'react'
import { Button, Input, Label, Switch, TextArea, TextField } from '@heroui/react'
import { NativeSelect } from '@heroui-pro/react/native-select'
import { toast } from 'sonner'

export function Field({ label, value, onChange, multiline = false, type = 'text', placeholder, readOnly = false, maxLength, children }: {
  label: string; value: string; onChange?: (value: string) => void; multiline?: boolean; type?: 'text' | 'number' | 'date' | 'datetime-local' | 'url'; placeholder?: string; readOnly?: boolean; maxLength?: number; children?: ReactNode
}) {
  return <TextField className="utility-field" value={value} onChange={onChange} isReadOnly={readOnly} variant="secondary" type={type}>
    <Label>{label}</Label>
    {multiline ? <TextArea className="utility-textarea" spellCheck={false} placeholder={placeholder} maxLength={maxLength} /> : <Input placeholder={placeholder} maxLength={maxLength} />}
    {children}
  </TextField>
}

export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[] }) {
  const id = useId()
  return <div className="utility-field"><label htmlFor={id}>{label}</label><NativeSelect variant="secondary" fullWidth><NativeSelect.Trigger id={id} value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, title]) => <NativeSelect.Option key={key} value={key}>{title}</NativeSelect.Option>)}</NativeSelect.Trigger></NativeSelect></div>
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <Switch isSelected={value} onChange={onChange} className="utility-toggle"><Switch.Content><span>{label}</span><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content></Switch>
}

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  if (!children) return null
  return <p className={`utility-notice ${error ? 'utility-error' : ''}`} role={error ? 'alert' : 'status'}>{children}</p>
}

export function Result({ label = '结果', value, children }: { label?: string; value: string; children?: ReactNode }) {
  return <section className="utility-result" aria-label={label}><div className="utility-result-heading"><h2>{label}</h2><CopyButton value={value} /></div>{children || <pre tabIndex={0}>{value || '结果会显示在这里'}</pre>}</section>
}

export function CopyButton({ value }: { value: string }) {
  return <Button size="sm" variant="ghost" isDisabled={!value} onPress={async () => {
    try { await navigator.clipboard.writeText(value); toast.success('已复制') } catch { toast.error('复制失败，请手动选择结果复制') }
  }}>复制</Button>
}

export function KeyValues({ values }: { values: readonly (readonly [string, ReactNode])[] }) {
  return <dl className="utility-values">{values.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value ?? '—'}</dd></div>)}</dl>
}

/** Tool input stays component-local; an action reports failures without discarding the last result. */
export function useOperation() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function run(action: () => void | Promise<void>) {
    setError(''); setBusy(true)
    try { await action() } catch (error) { setError(error instanceof Error ? error.message : '处理失败，请检查输入') } finally { setBusy(false) }
  }
  return { error, busy, run, setError }
}

export async function requestTool<T>(id: string, action: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/v1/tools/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error?.message || `请求失败 (${response.status})`)
  return result as T
}
