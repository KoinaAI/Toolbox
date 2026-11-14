import { Temporal } from '@js-temporal/polyfill'

export const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
export const zones: readonly (readonly [string,string])[] = [...new Set(['UTC', localZone, 'Asia/Shanghai', 'Asia/Tokyo', 'America/New_York', 'Europe/London', ...Intl.supportedValuesOf('timeZone')])].map(zone => [zone, zone])

/** Parses fractional Unix seconds/milliseconds without losing the input's integer precision. */
export function timestampInstant(raw: string, unit: 's' | 'ms' | 'auto') {
  const text = raw.trim()
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(text) || text.length > 40) throw new Error('请输入有效的 Unix 时间戳')
  const [whole, fraction = ''] = text.replace(/^[+-]/,'').split('.')
  const selected = unit === 'auto' ? (whole.length >= 13 ? 'ms' : 's') : unit
  const digits = selected === 's' ? 9 : 6
  if (fraction.length > digits) throw new Error('时间戳精度最多为纳秒')
  const nanos = (BigInt(whole) * 10n ** BigInt(digits) + BigInt(fraction.padEnd(digits,'0'))) * (text.startsWith('-') ? -1n : 1n)
  return { instant: Temporal.Instant.fromEpochNanoseconds(nanos), unit: selected }
}

export function dateDifference(start: string, end: string, inclusive = false) {
  const days = Temporal.PlainDate.from(start).until(Temporal.PlainDate.from(end), { largestUnit: 'day' }).days
  return inclusive ? days + (days < 0 ? -1 : 1) : days
}

export function epochSeconds(instant: Temporal.Instant): string {
  const negative = instant.epochNanoseconds < 0n
  const value = (negative ? -instant.epochNanoseconds : instant.epochNanoseconds).toString().padStart(10,'0')
  const fraction = value.slice(-9).replace(/0+$/,'')
  return (negative ? '-' : '') + value.slice(0,-9) + (fraction ? '.' + fraction : '')
}

export function zonedDateTime(input: string, zone: string, disambiguation: 'reject' | 'earlier' | 'later' = 'reject') {
  return Temporal.PlainDateTime.from(input).toZonedDateTime(zone, { disambiguation })
}
