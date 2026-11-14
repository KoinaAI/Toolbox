import { base64urlnopad } from '@scure/base'

const provinces = new Set(['11','12','13','14','15','21','22','23','31','32','33','34','35','36','37','41','42','43','44','45','46','50','51','52','53','54','61','62','63','64','65','71','81','82'])
const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const checks = '10X98765432'

/** Checks the 18-digit mainland resident ID structure, calendar date and MOD 11-2 digit; never authenticates a person. */
export function checkIdentity(raw: string, today = new Date()) {
  const value = raw.trim().toUpperCase()
  if (!/^\d{17}[0-9X]$/.test(value)) throw new Error('请输入 18 位居民身份证号，最后一位可以是 X')
  if (!provinces.has(value.slice(0, 2)) || value.slice(2, 6) === '0000') throw new Error('地址码格式不合法')
  const year = Number(value.slice(6, 10)), month = Number(value.slice(10, 12)), day = Number(value.slice(12, 14))
  const birth = new Date(Date.UTC(year, month - 1, day))
  const localToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  if (year < 1800 || birth.getUTCFullYear() !== year || birth.getUTCMonth() !== month - 1 || birth.getUTCDate() !== day || birth.getTime() > localToday) throw new Error('出生日期不合法或晚于今天')
  if (value.slice(14, 17) === '000') throw new Error('顺序码不能为 000')
  const expected = checks[weights.reduce((sum, weight, i) => sum + Number(value[i]) * weight, 0) % 11]
  return { valid: expected === value[17], expected, actual: value[17], regionCode: value.slice(0, 6), birthday: `${value.slice(6, 10)}-${value.slice(10, 12)}-${value.slice(12, 14)}`, sex: Number(value[16]) % 2 ? '男' : '女' }
}

/** JWT parsing deliberately does not verify its signature or treat claims as trusted. */
export function parseJWT(raw: string) {
  const token = raw.trim()
  if (token.length > 262144) throw new Error('JWT 最多 256 KiB')
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('请输入三段式 JWT；不支持五段式加密 JWE')
  const decode = (part: string) => {
    if (!/^[\w-]+$/.test(part)) throw new Error('JWT 包含无效的 Base64URL 段')
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(base64urlnopad.decode(part)))
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Header 和 Payload 必须是 JSON 对象')
    return value as Record<string, unknown>
  }
  const header = decode(parts[0]), payload = decode(parts[1])
  if (typeof header.alg !== 'string' || !header.alg) throw new Error('Header 缺少 alg 算法标识')
  if (!/^[\w-]*$/.test(parts[2])) throw new Error('签名段包含无效字符')
  if (header.alg === 'none' && parts[2]) throw new Error('alg=none 时签名段必须为空')
  if (parts[2]) base64urlnopad.decode(parts[2])
  return { header, payload, signature: parts[2] }
}

export function countText(text: string) {
  const graphemes = [...new Intl.Segmenter('zh', { granularity: 'grapheme' }).segment(text)]
  let han = 0, punctuation = 0
  for (const { segment } of graphemes) {
    if (/\p{Script=Han}/u.test(segment)) han++
    if (/\p{P}/u.test(segment)) punctuation++
  }
  // Separate Han runs first: mixed words such as hello世界 must count under both rules.
  const remaining = text.replace(/\p{Script=Han}\p{Variation_Selector}*/gu, ' ')
  let latin = 0, other = 0, numbers = 0
  for (const { segment, isWordLike } of new Intl.Segmenter('en', { granularity: 'word' }).segment(remaining)) {
    if (!isWordLike) continue
    if (/\p{Script=Latin}/u.test(segment)) latin++
    else if (/^\p{N}+$/u.test(segment)) numbers++
    else other++
  }
  return { han, latin, other, numbers, punctuation, total: han + latin + other + numbers, characters: graphemes.length, nonWhitespace: graphemes.filter(({segment}) => !/^\s+$/u.test(segment)).length, lines: text ? text.split(/\r\n|\r|\n/).length : 0, paragraphs: text.trim() ? text.trim().replace(/\r\n?/g,'\n').split(/\n\s*\n/).length : 0, bytes: new TextEncoder().encode(text).length }
}
