import { useEffect, useRef, useState } from 'react'
import { Button } from '@heroui/react'
import type { RegexResult } from '../core/regex'
import RegexWorker from '../workers/regex.worker?worker'
import { Field, Notice, Result, useOperation } from '../shared'

export default function RegexTester() {
  const [pattern, setPattern] = useState(''),
    [flags, setFlags] = useState('g'),
    [input, setInput] = useState(''),
    [result, setResult] = useState<RegexResult | null>(null)
  const worker = useRef<Worker | null>(null),
    op = useOperation()
  useEffect(() => () => worker.current?.terminate(), [])
  const run = () =>
    op.run(
      () =>
        new Promise<void>((resolve, reject) => {
          const task = new RegexWorker()
          worker.current = task
          const finish = () => {
            clearTimeout(timer)
            task.terminate()
            worker.current = null
          }
          const timer = window.setTimeout(() => {
            finish()
            reject(
              new Error(
                '执行超过 2 秒，已终止。表达式可能存在灾难性回溯，请缩短输入或修改量词。',
              ),
            )
          }, 2000)
          task.onmessage = (event) => {
            finish()
            if (event.data.error) reject(new Error(event.data.error))
            else {
              setResult(event.data.result)
              resolve()
            }
          }
          task.onerror = () => {
            finish()
            reject(new Error('正则工作线程加载失败'))
          }
          task.postMessage({ pattern, flags, input })
        }),
    )
  return (
    <div className="utility-stack">
      <Field
        label="表达式（不包含两侧 /）"
        value={pattern}
        onChange={setPattern}
        maxLength={4096}
      />
      <Field label="标志" value={flags} onChange={setFlags} maxLength={8} />
      <Field
        label="测试文本"
        value={input}
        onChange={setInput}
        multiline
        maxLength={262144}
      />
      <div className="utility-actions">
        <Button isPending={op.busy} onPress={run}>
          解析并测试
        </Button>
        <Button
          variant="ghost"
          isDisabled={op.busy}
          onPress={() => {
            setInput('')
            setPattern('')
            setResult(null)
            op.setError('')
          }}
        >
          清空
        </Button>
      </div>
      <Notice error>{op.error}</Notice>
      {result && (
        <>
          <Notice>
            匹配 {result.matches.length} 项
            {result.truncated ? '（仅显示前 200 项）' : ''}，位置以 JavaScript
            UTF-16 偏移计数。单项内容最多展示 10,000 字符，捕获组最多 12
            个、每组 500 字符。
          </Notice>
          <Result
            label="匹配结果与捕获组"
            value={JSON.stringify(result.matches, null, 2)}
          />
          <Result
            label="语法解析"
            value={result.syntax.join('\n') || '字面字符模式，无特殊语法结构'}
          />
        </>
      )}
      <Notice>
        使用当前浏览器的 JavaScript 正则引擎，不是 PCRE。g 全局、i 忽略大小写、m
        多行、s 点匹配换行、u Unicode、v Unicode 集合、y 粘连、d
        索引。隔离线程在超时后终止，输入不上传。
      </Notice>
    </div>
  )
}
