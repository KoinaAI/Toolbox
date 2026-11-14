import { useMemo, useState } from 'react'
import { clampRgb, converter, formatCss, formatHex, formatHex8, formatHsl, formatRgb, inGamut, parse } from 'culori'
import { Field, Notice, Result } from '../shared'

export default function Color() {
  const [input,setInput] = useState('')
  const result = useMemo(() => {
    if (!input.trim()) return null
    const color = parse(input.trim())
    if (!color) return { error: '无法解析颜色，请输入 HEX、RGB、HSL、HWB、Lab、OKLCH 或 CSS 颜色名。' }
    const rgb = clampRgb(color)
    return { swatch: formatRgb(rgb), clipped: !inGamut('rgb')(color), values: [
      ['HEX', (rgb.alpha ?? 1) < 1 ? formatHex8(rgb) : formatHex(rgb)], ['RGB / RGBA', formatRgb(rgb)], ['HSL / HSLA', formatHsl(rgb)], ['HWB',formatCss(converter('hwb')(color))], ['Lab',formatCss(converter('lab65')(color))], ['OKLCH',formatCss(converter('oklch')(color))],
    ] as [string,string][] }
  }, [input])
  return <div className="utility-stack"><Field label="颜色编码" value={input} onChange={setInput} placeholder="输入颜色，例如 HEX、rgb()、hsl() 或 oklch()" maxLength={300} /><Notice error>{result?.error}</Notice>{result?.values && <><div className="utility-color-preview" style={{background:result.swatch}} aria-label={`当前颜色 ${result.swatch}`} /><div className="utility-columns">{result.values.map(([label,value]) => <Result key={label} label={label} value={value} />)}</div>{result.clipped && <Notice>此颜色超出 sRGB 色域；预览、HEX、RGB 和 HSL 已裁剪到 sRGB，Lab / OKLCH 保留原色。</Notice>}</>}<Notice>支持透明度。转换和预览都在浏览器内完成；预览效果取决于显示设备的色域。</Notice></div>
}
