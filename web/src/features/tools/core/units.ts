type Unit = { id: string; label: string; factor: number; offset?: number }
type Group = { id: string; label: string; units: Unit[] }
export const unitGroups: Group[] = [
  {
    id: 'length',
    label: '长度',
    units: [
      { id: 'm', label: '米 m', factor: 1 },
      { id: 'km', label: '千米 km', factor: 1000 },
      { id: 'cm', label: '厘米 cm', factor: 0.01 },
      { id: 'mm', label: '毫米 mm', factor: 0.001 },
      { id: 'um', label: '微米 μm', factor: 0.000001 },
      { id: 'in', label: '英寸 in', factor: 0.0254 },
      { id: 'ft', label: '英尺 ft', factor: 0.3048 },
      { id: 'yd', label: '码 yd', factor: 0.9144 },
      { id: 'mi', label: '英里 mi', factor: 1609.344 },
      { id: 'nmi', label: '海里 nmi', factor: 1852 },
    ],
  },
  {
    id: 'mass',
    label: '质量',
    units: [
      { id: 'kg', label: '千克 kg', factor: 1 },
      { id: 'g', label: '克 g', factor: 0.001 },
      { id: 'mg', label: '毫克 mg', factor: 0.000001 },
      { id: 't', label: '公吨 t', factor: 1000 },
      { id: 'lb', label: '磅 lb', factor: 0.45359237 },
      { id: 'oz', label: '盎司 oz', factor: 0.028349523125 },
      { id: 'jin', label: '市斤（500 克）', factor: 0.5 },
    ],
  },
  {
    id: 'temperature',
    label: '温度',
    units: [
      { id: 'K', label: '开尔文 K', factor: 1 },
      { id: 'C', label: '摄氏度 °C', factor: 1, offset: 273.15 },
      {
        id: 'F',
        label: '华氏度 °F',
        factor: 5 / 9,
        offset: 273.15 - (32 * 5) / 9,
      },
    ],
  },
  {
    id: 'area',
    label: '面积',
    units: [
      { id: 'm2', label: '平方米 m²', factor: 1 },
      { id: 'km2', label: '平方千米 km²', factor: 1e6 },
      { id: 'cm2', label: '平方厘米 cm²', factor: 0.0001 },
      { id: 'ha', label: '公顷 ha', factor: 10000 },
      { id: 'mu', label: '市亩', factor: 2000 / 3 },
      { id: 'ft2', label: '平方英尺 ft²', factor: 0.09290304 },
      { id: 'acre', label: '英亩', factor: 4046.8564224 },
    ],
  },
  {
    id: 'volume',
    label: '体积',
    units: [
      { id: 'L', label: '升 L', factor: 1 },
      { id: 'mL', label: '毫升 mL', factor: 0.001 },
      { id: 'm3', label: '立方米 m³', factor: 1000 },
      { id: 'gal', label: '美制加仑 US gal', factor: 3.785411784 },
      { id: 'qt', label: '美制夸脱 US qt', factor: 0.946352946 },
      { id: 'floz', label: '美制液量盎司', factor: 0.0295735295625 },
    ],
  },
  {
    id: 'speed',
    label: '速度',
    units: [
      { id: 'mps', label: '米/秒 m/s', factor: 1 },
      { id: 'kph', label: '千米/时 km/h', factor: 1 / 3.6 },
      { id: 'mph', label: '英里/时 mph', factor: 0.44704 },
      { id: 'kn', label: '节 kn', factor: 1852 / 3600 },
    ],
  },
  {
    id: 'time',
    label: '时间长度',
    units: [
      { id: 's', label: '秒 s', factor: 1 },
      { id: 'ms', label: '毫秒 ms', factor: 0.001 },
      { id: 'min', label: '分钟 min', factor: 60 },
      { id: 'h', label: '小时 h', factor: 3600 },
      { id: 'day', label: '天（24 小时）', factor: 86400 },
      { id: 'week', label: '周（7 天）', factor: 604800 },
    ],
  },
  {
    id: 'data',
    label: '数据大小',
    units: [
      { id: 'B', label: '字节 B', factor: 1 },
      { id: 'bit', label: '比特 bit', factor: 0.125 },
      { id: 'kB', label: '千字节 kB（1000）', factor: 1000 },
      { id: 'MB', label: 'MB（1000²）', factor: 1e6 },
      { id: 'GB', label: 'GB（1000³）', factor: 1e9 },
      { id: 'TB', label: 'TB（1000⁴）', factor: 1e12 },
      { id: 'KiB', label: 'KiB（1024）', factor: 1024 },
      { id: 'MiB', label: 'MiB（1024²）', factor: 1024 ** 2 },
      { id: 'GiB', label: 'GiB（1024³）', factor: 1024 ** 3 },
      { id: 'TiB', label: 'TiB（1024⁴）', factor: 1024 ** 4 },
    ],
  },
  {
    id: 'pressure',
    label: '压力',
    units: [
      { id: 'Pa', label: '帕 Pa', factor: 1 },
      { id: 'kPa', label: '千帕 kPa', factor: 1000 },
      { id: 'bar', label: '巴 bar', factor: 100000 },
      { id: 'atm', label: '标准大气压 atm', factor: 101325 },
      { id: 'psi', label: '磅力/平方英寸 psi', factor: 6894.757293168 },
    ],
  },
  {
    id: 'energy',
    label: '能量',
    units: [
      { id: 'J', label: '焦耳 J', factor: 1 },
      { id: 'kJ', label: '千焦 kJ', factor: 1000 },
      { id: 'cal', label: '热化学卡 cal', factor: 4.184 },
      { id: 'kcal', label: '千卡 kcal', factor: 4184 },
      { id: 'Wh', label: '瓦时 Wh', factor: 3600 },
      { id: 'kWh', label: '千瓦时 kWh', factor: 3600000 },
    ],
  },
]
export function convertUnit(
  raw: string,
  groupId: string,
  fromId: string,
  toId: string,
): number {
  if (
    !raw.trim() ||
    !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim())
  )
    throw new Error('请输入有效数值，可使用科学计数法')
  const value = Number(raw),
    group = unitGroups.find((group) => group.id === groupId),
    from = group?.units.find((unit) => unit.id === fromId),
    to = group?.units.find((unit) => unit.id === toId)
  if (!Number.isFinite(value) || !from || !to)
    throw new Error('数值或单位不合法')
  const base = value * from.factor + (from.offset || 0)
  if (groupId === 'temperature' && base < -1e-10)
    throw new Error('温度不能低于绝对零度')
  // Divide scale factors before multiplying so finite conversions do not
  // overflow through the canonical unit (for example 1e308 km → km).
  const result =
    value * (from.factor / to.factor) +
    ((from.offset || 0) - (to.offset || 0)) / to.factor
  if (!Number.isFinite(result)) throw new Error('结果超出数值范围')
  return Object.is(result, -0) ? 0 : result
}
