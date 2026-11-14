import { useEffect, useRef, useState } from 'react'
import { Button } from '@heroui/react'
import type { ToolWorkspaceProps } from '../registry'
import {
  Field,
  KeyValues,
  Notice,
  Result,
  SelectField,
  requestTool,
  useOperation,
} from '../shared'

type DNSResult = {
  name: string
  type: string
  answers: { value: string; preference?: number }[]
}
type IPResult = {
  ip: string
  type: string
  public: boolean
  message?: string
  country?: string
  region?: string
  city?: string
  connection?: { asn: number; org: string; isp: string; domain: string }
  timezone?: { id: string }
}
type HTTPResult = {
  status: number
  statusText: string
  headers: Record<string, string[]>
  body: string
  encoding: string
  truncated: boolean
  durationMs: number
  url: string
}

export default function Network({ tool }: ToolWorkspaceProps) {
  const [input, setInput] = useState(''),
    [type, setType] = useState('A'),
    [method, setMethod] = useState('GET'),
    [headers, setHeaders] = useState(''),
    [body, setBody] = useState('')
  const [dns, setDNS] = useState<DNSResult | null>(null),
    [ip, setIP] = useState<IPResult | null>(null),
    [http, setHTTP] = useState<HTTPResult | null>(null)
  const controller = useRef<AbortController | null>(null),
    op = useOperation()
  useEffect(() => () => controller.current?.abort(), [])
  const run = () =>
    op.run(async () => {
      const active = new AbortController()
      controller.current = active
      const timeout = window.setTimeout(() => active.abort(), 15000)
      try {
        if (tool.id === 'dns')
          setDNS(
            await requestTool<DNSResult>(
              'dns',
              'query',
              { name: input, type },
              active.signal,
            ),
          )
        else if (tool.id === 'ip')
          setIP(
            await requestTool<IPResult>(
              'ip',
              'query',
              { ip: input },
              active.signal,
            ),
          )
        else {
          const parsed: unknown = headers.trim() ? JSON.parse(headers) : {}
          if (
            !parsed ||
            typeof parsed !== 'object' ||
            Array.isArray(parsed) ||
            Object.values(parsed).some((value) => typeof value !== 'string')
          )
            throw new Error('请求头必须是 JSON 对象，每个值都是字符串')
          setHTTP(
            await requestTool<HTTPResult>(
              'http-client',
              'request',
              {
                url: input,
                method,
                headers: parsed,
                body: method === 'POST' ? body : '',
              },
              active.signal,
            ),
          )
        }
      } catch (error) {
        if (active.signal.aborted) throw new Error('请求已取消或超时')
        throw error
      } finally {
        clearTimeout(timeout)
        controller.current = null
      }
    })
  return (
    <div className="utility-stack">
      <Field
        label={
          tool.id === 'dns'
            ? type === 'PTR'
              ? 'IP 地址'
              : '域名'
            : tool.id === 'ip'
              ? 'IPv4 / IPv6 地址'
              : '请求 URL'
        }
        value={input}
        onChange={setInput}
        maxLength={8192}
      />
      {tool.id === 'dns' && (
        <SelectField
          label="记录类型"
          value={type}
          onChange={setType}
          options={['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'PTR'].map(
            (value) => [value, value],
          )}
        />
      )}
      {tool.id === 'http-client' && (
        <>
          <SelectField
            label="方法"
            value={method}
            onChange={setMethod}
            options={[
              ['GET', 'GET'],
              ['POST', 'POST'],
            ]}
          />
          <Field
            label="请求头（JSON 对象，可留空）"
            value={headers}
            onChange={setHeaders}
            multiline
            maxLength={16384}
          />
          {method === 'POST' && (
            <Field
              label="请求体"
              value={body}
              onChange={setBody}
              multiline
              maxLength={262144}
            />
          )}
        </>
      )}
      <div className="utility-actions">
        <Button isPending={op.busy} onPress={run}>
          {tool.id === 'http-client' ? '发送请求' : '查询'}
        </Button>
        {op.busy && (
          <Button variant="ghost" onPress={() => controller.current?.abort()}>
            取消
          </Button>
        )}
      </div>
      <Notice error>{op.error}</Notice>
      {tool.id === 'dns' && dns && (
        <Result
          label={`${dns.type} 查询结果`}
          value={JSON.stringify(dns.answers, null, 2)}
        />
      )}
      {tool.id === 'ip' && ip && (
        <>
          <KeyValues
            values={[
              ['IP 地址', ip.ip],
              ['类型', ip.type],
              ['公网地址', ip.public ? '是' : '否'],
              ['国家 / 地区', ip.country || '—'],
              ['省 / 州', ip.region || '—'],
              ['城市', ip.city || '—'],
              ['ASN', ip.connection?.asn],
              ['运营商', ip.connection?.isp],
              ['网络组织', ip.connection?.org],
              ['时区', ip.timezone?.id],
            ]}
          />
          {ip.message && <Notice>{ip.message}</Notice>}
        </>
      )}
      {tool.id === 'http-client' && http && (
        <>
          <KeyValues
            values={[
              ['状态', http.statusText],
              ['耗时', `${http.durationMs} ms`],
              ['响应编码', http.encoding],
              ['内容截断', http.truncated ? '是，最多展示 1 MiB' : '否'],
            ]}
          />
          <Result
            label="响应头"
            value={JSON.stringify(http.headers, null, 2)}
          />
          <Result
            label={`响应体（${http.encoding}）`}
            value={http.body || '（空响应体）'}
          />
        </>
      )}
      <Notice>
        {tool.id === 'dns'
          ? '查询由服务器 DNS 解析器执行。CNAME 返回解析后的规范名，无别名时为空；不会虚构 TTL。'
          : tool.id === 'ip'
            ? '公网 IP 会发送至 ipwho.is 获取大致归属地（非精确位置）；免费接口配额由服务器共享，查询结果缓存 6 小时。专用及特殊用途地址不会发送给第三方。'
            : '请求由服务器发送，不受浏览器 CORS 限制。仅支持公网 HTTP/HTTPS；不跟随重定向。请求体最多 256 KiB，响应最多 1 MiB，超时 12 秒；二进制响应以 Base64 显示。请仅向你信任的目标发送凭据。'}
      </Notice>
    </div>
  )
}
