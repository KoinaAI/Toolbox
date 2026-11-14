import { useState } from 'react'
import { Button } from '@heroui/react'
import { decodeBytes, encodeBytes, encodingNotes, type Encoding } from '../core/encoding'
import { Field, Notice, Result, SelectField, Toggle, useOperation } from '../shared'

export default function BaseEncoding() {
  const [encoding, setEncoding] = useState<Encoding>('64'), [input, setInput] = useState(''), [output, setOutput] = useState(''), [urlSafe, setUrlSafe] = useState(false)
  const op = useOperation()
  const convert = (decode: boolean) => op.run(() => setOutput(decode ? new TextDecoder('utf-8', { fatal: true }).decode(decodeBytes(input, encoding, urlSafe)) : encodeBytes(new TextEncoder().encode(input), encoding, urlSafe)))
  return <div className="utility-stack"><div className="utility-toolbar"><div className="utility-segments" aria-label="编码格式">{(['64','32','16'] as const).map(base => <Button key={base} variant={encoding === base ? 'secondary' : 'ghost'} onPress={() => { setEncoding(base); setOutput(''); op.setError('') }}>Base{base}</Button>)}</div><details className="utility-more"><summary>{!['64','32','16'].includes(encoding) ? `Base${encoding}` : '更多编码'}</summary><div className="utility-more-options">{(['36','45','58','62','85','91'] as const).map(base => <Button key={base} size="sm" variant={encoding === base ? 'secondary' : 'ghost'} onPress={() => { setEncoding(base); setOutput(''); op.setError('') }}>Base{base}</Button>)}</div></details></div>
    {encoding === '64' && <Toggle label="URL-safe 字符表" value={urlSafe} onChange={setUrlSafe} />}<Field label="输入文本或编码" value={input} onChange={setInput} multiline maxLength={600000} />
    <div className="utility-actions"><Button onPress={() => convert(false)}>编码</Button><Button variant="secondary" onPress={() => convert(true)}>解码</Button><Button variant="ghost" onPress={() => { setInput(output); setOutput(''); op.setError('') }} isDisabled={!output}>结果作为输入</Button><Button variant="ghost" onPress={() => { setInput(''); setOutput(''); op.setError('') }}>清空</Button></div>
    <Notice error>{op.error}</Notice><Result value={output} /><Notice>{encodingNotes[encoding]} 解码结果必须是有效 UTF-8；二进制图片请使用 Base64 转图片。</Notice></div>
}

export function NumberBase() {
  const [input, setInput] = useState(''), [from, setFrom] = useState('10'), [to, setTo] = useState('16'), [output, setOutput] = useState('')
  const [customFrom, setCustomFrom] = useState('10'), [customTo, setCustomTo] = useState('36')
  const op = useOperation()
  const options = [['2','二进制'],['8','八进制'],['10','十进制'],['16','十六进制'],['custom','自定义']] as const
  return <div className="utility-stack"><div className="utility-columns"><SelectField label="原进制" value={from} onChange={setFrom} options={options} /><SelectField label="目标进制" value={to} onChange={setTo} options={options} /></div><div className="utility-columns">{from === 'custom' && <Field label="原进制（2–36）" value={customFrom} onChange={setCustomFrom} type="number" />}{to === 'custom' && <Field label="目标进制（2–36）" value={customTo} onChange={setCustomTo} type="number" />}</div><Field label="整数" value={input} onChange={setInput} multiline maxLength={10000} /><div className="utility-actions"><Button onPress={() => op.run(async () => { const { convertInteger } = await import('../core/encoding'); setOutput(convertInteger(input, Number(from === 'custom' ? customFrom : from), Number(to === 'custom' ? customTo : to))) })}>转换</Button><Button variant="ghost" onPress={() => { setInput(''); setOutput(''); op.setError('') }}>清空</Button></div><Notice error>{op.error}</Notice><Result value={output} /><Notice>使用 BigInt 保持整数精度。支持正负整数，字母 A–Z 表示 10–35，不接受 0x 等前缀。</Notice></div>
}
