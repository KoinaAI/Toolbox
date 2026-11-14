import { useEffect, useRef, useState } from 'react'
import { Button } from '@heroui/react'
import type { ToolWorkspaceProps } from '../registry'
import {
  Field,
  KeyValues,
  Notice,
  SelectField,
  Toggle,
  useOperation,
} from '../shared'

export default function ImageTool({ tool }: ToolWorkspaceProps) {
  const [file, setFile] = useState<File | null>(null),
    [format, setFormat] = useState(
      tool.id === 'image-convert' ? 'png' : 'auto',
    ),
    [quality, setQuality] = useState('80'),
    [width, setWidth] = useState(''),
    [height, setHeight] = useState(''),
    [keepAspect, setKeepAspect] = useState(true)
  const [result, setResult] = useState<{
    url: string
    size: number
    original: number
    type: string
    width: string
    height: string
    extension: string
  } | null>(null)
  const controller = useRef<AbortController | null>(null),
    op = useOperation()
  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url)
    },
    [result],
  )
  useEffect(() => () => controller.current?.abort(), [])
  const convert = () =>
    op.run(async () => {
      if (!file) throw new Error('请先选择图片')
      if (file.size > 12 * 1024 * 1024) throw new Error('图片最多 12 MiB')
      const data = new FormData()
      data.set('file', file)
      data.set('format', format)
      data.set('quality', quality)
      if (tool.id === 'image-resize') {
        data.set('width', width)
        data.set('height', height)
        data.set('keepAspect', String(keepAspect))
      }
      const active = new AbortController()
      controller.current = active
      const timeout = window.setTimeout(() => active.abort(), 35000)
      try {
        const response = await fetch(`/api/v1/tools/${tool.id}/process`, {
          method: 'POST',
          body: data,
          signal: active.signal,
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(
            error.error?.message || `处理失败 (${response.status})`,
          )
        }
        const blob = await response.blob(),
          type = response.headers.get('Content-Type') || blob.type
        setResult({
          url: URL.createObjectURL(blob),
          size: blob.size,
          original:
            Number(response.headers.get('X-Original-Size')) || file.size,
          type,
          width: response.headers.get('X-Image-Width') || '—',
          height: response.headers.get('X-Image-Height') || '—',
          extension:
            type === 'image/jpeg' ? 'jpg' : type.split('/')[1] || 'bin',
        })
      } catch (error) {
        if (active.signal.aborted) throw new Error('处理已取消或超时')
        throw error
      } finally {
        clearTimeout(timeout)
        controller.current = null
      }
    })
  return (
    <div className="utility-stack">
      <label className="utility-field">
        <span>选择图片（最多 12 MiB）</span>
        <input
          className="utility-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif"
          disabled={op.busy}
          onChange={(event) => {
            setFile(event.target.files?.[0] || null)
            setResult(null)
            op.setError('')
          }}
        />
      </label>
      <div className="utility-columns">
        <SelectField
          label="输出格式"
          value={format}
          onChange={setFormat}
          options={[
            ...(tool.id === 'image-convert'
              ? []
              : [['auto', '保持原格式（GIF/BMP/TIFF 转 PNG）'] as const]),
            ['jpeg', 'JPEG'],
            ['png', 'PNG'],
            ['webp', 'WebP'],
            ['avif', 'AVIF'],
          ]}
        />
        <Field
          label="有损编码质量（1–100，PNG 不使用）"
          value={quality}
          onChange={setQuality}
          type="number"
        />
      </div>
      {tool.id === 'image-resize' && (
        <>
          <div className="utility-columns">
            <Field
              label="目标宽度（像素，可留空）"
              value={width}
              onChange={setWidth}
              type="number"
            />
            <Field
              label="目标高度（像素，可留空）"
              value={height}
              onChange={setHeight}
              type="number"
            />
          </div>
          <Toggle
            label="保持宽高比（两项均填写时按边界框缩放）"
            value={keepAspect}
            onChange={setKeepAspect}
          />
        </>
      )}
      <div className="utility-actions">
        <Button isPending={op.busy} onPress={convert}>
          {tool.id === 'image-compress'
            ? '压缩图片'
            : tool.id === 'image-resize'
              ? '调整尺寸'
              : '转换格式'}
        </Button>
        {op.busy && (
          <Button variant="ghost" onPress={() => controller.current?.abort()}>
            取消
          </Button>
        )}
      </div>
      <Notice error>{op.error}</Notice>
      {result && (
        <>
          <img
            className="utility-image"
            src={result.url}
            alt="FFmpeg 处理后的图片"
          />
          <KeyValues
            values={[
              ['输出格式', result.type],
              ['输出尺寸', `${result.width} × ${result.height}`],
              ['原文件', `${result.original.toLocaleString()} 字节`],
              ['结果文件', `${result.size.toLocaleString()} 字节`],
              [
                '体积变化',
                `${((1 - result.size / result.original) * 100).toFixed(1)}%（正值为减小）`,
              ],
            ]}
          />
          <a
            className="primary-link w-fit"
            href={result.url}
            download={`toolbox-image.${result.extension}`}
          >
            下载结果
          </a>
        </>
      )}
      <Notice>
        图片会上传到本站 FFmpeg
        处理，仅保留第一帧并移除元数据，任务结束即删除临时文件。JPEG
        透明区域合成为白色。PNG 压缩不使用质量参数，结果可能比原图大。最多 2400
        万像素、单边 12000；AVIF 输出最多 800 万像素；每项任务限时 25 秒。
      </Notice>
    </div>
  )
}
