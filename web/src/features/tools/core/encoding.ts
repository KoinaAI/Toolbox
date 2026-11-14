import {
  base16,
  base32,
  base32nopad,
  base64,
  base64nopad,
  base64url,
  base64urlnopad,
} from '@scure/base'

export const ENCODINGS = [
  '64',
  '32',
  '16',
  '36',
  '45',
  '58',
  '62',
  '85',
  '91',
] as const
export type Encoding = (typeof ENCODINGS)[number]
const B45 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
const B91 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"'
const B36 = '0123456789abcdefghijklmnopqrstuvwxyz'
const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function radixEncode(bytes: Uint8Array, alphabet: string): string {
  let zeroes = 0,
    value = 0n
  for (const byte of bytes) value = value * 256n + BigInt(byte)
  while (zeroes < bytes.length && bytes[zeroes] === 0) zeroes++
  let output = ''
  while (value > 0n) {
    output = alphabet[Number(value % BigInt(alphabet.length))] + output
    value /= BigInt(alphabet.length)
  }
  return alphabet[0].repeat(zeroes) + output
}
function radixDecode(text: string, alphabet: string): Uint8Array {
  let value = 0n,
    zeroes = 0
  while (zeroes < text.length && text[zeroes] === alphabet[0]) zeroes++
  for (const char of text) {
    const digit = alphabet.indexOf(char)
    if (digit < 0)
      throw new Error(`字符 ${JSON.stringify(char)} 不在当前字符表中`)
    value = value * BigInt(alphabet.length) + BigInt(digit)
  }
  const output: number[] = []
  while (value > 0n) {
    output.push(Number(value % 256n))
    value /= 256n
  }
  return Uint8Array.from([
    ...Array<number>(zeroes).fill(0),
    ...output.reverse(),
  ])
}

function encode45(bytes: Uint8Array): string {
  let output = ''
  for (let i = 0; i < bytes.length; i += 2) {
    const pair = i + 1 < bytes.length
    let value = pair ? bytes[i] * 256 + bytes[i + 1] : bytes[i]
    output += B45[value % 45]
    value = Math.floor(value / 45)
    output += B45[value % 45]
    if (pair) output += B45[Math.floor(value / 45)]
  }
  return output
}
function decode45(text: string): Uint8Array {
  if (text.length % 3 === 1) throw new Error('Base45 长度不能余 1')
  const output: number[] = []
  for (let i = 0; i < text.length; i += 3) {
    const count = Math.min(3, text.length - i)
    let value = 0
    for (let j = 0; j < count; j++) {
      const digit = B45.indexOf(text[i + j])
      if (digit < 0)
        throw new Error('无效的 Base45 字符（空格也是编码的一部分）')
      value += digit * 45 ** j
    }
    if (value > (count === 3 ? 65535 : 255))
      throw new Error('Base45 分组超出字节范围')
    if (count === 3) output.push(value >> 8)
    output.push(value & 255)
  }
  return Uint8Array.from(output)
}

function encode85(bytes: Uint8Array): string {
  let output = ''
  for (let i = 0; i < bytes.length; i += 4) {
    const count = Math.min(4, bytes.length - i)
    let value = 0
    for (let j = 0; j < 4; j++) value = value * 256 + (bytes[i + j] || 0)
    if (value === 0 && count === 4) {
      output += 'z'
      continue
    }
    let block = ''
    for (let j = 0; j < 5; j++) {
      block = String.fromCharCode((value % 85) + 33) + block
      value = Math.floor(value / 85)
    }
    output += block.slice(0, count + 1)
  }
  return output
}
function decode85(raw: string): Uint8Array {
  let text = raw.replace(/\s/g, '')
  if (text.startsWith('<~') && text.endsWith('~>')) text = text.slice(2, -2)
  const output: number[] = [],
    block: number[] = []
  const flush = (count: number) => {
    let value = 0
    for (let i = 0; i < 5; i++) value = value * 85 + (block[i] ?? 84)
    if (value > 0xffffffff) throw new Error('Ascii85 分组溢出')
    const bytes = [
      Math.floor(value / 0x1000000),
      (value >>> 16) & 255,
      (value >>> 8) & 255,
      value & 255,
    ]
    output.push(...bytes.slice(0, count))
    block.length = 0
  }
  for (const char of text) {
    if (char === 'z') {
      if (block.length) throw new Error('Ascii85 的 z 只能独立出现')
      output.push(0, 0, 0, 0)
      continue
    }
    const digit = char.charCodeAt(0) - 33
    if (digit < 0 || digit >= 85) throw new Error('无效的 Ascii85 字符')
    block.push(digit)
    if (block.length === 5) flush(4)
  }
  if (block.length === 1) throw new Error('Ascii85 末尾分组太短')
  if (block.length) flush(block.length - 1)
  return Uint8Array.from(output)
}

function encode91(bytes: Uint8Array): string {
  let buffer = 0,
    bits = 0,
    output = ''
  for (const byte of bytes) {
    buffer |= byte << bits
    bits += 8
    if (bits > 13) {
      let value = buffer & 8191
      if (value > 88) {
        buffer >>= 13
        bits -= 13
      } else {
        value = buffer & 16383
        buffer >>= 14
        bits -= 14
      }
      output += B91[value % 91] + B91[Math.floor(value / 91)]
    }
  }
  if (bits) {
    output += B91[buffer % 91]
    if (bits > 7 || buffer > 90) output += B91[Math.floor(buffer / 91)]
  }
  return output
}
function decode91(text: string): Uint8Array {
  let value = -1,
    buffer = 0,
    bits = 0
  const output: number[] = []
  for (const char of text) {
    const digit = B91.indexOf(char)
    if (digit < 0) throw new Error('无效的 basE91 字符（不接受空白）')
    if (value < 0) value = digit
    else {
      value += digit * 91
      buffer |= value << bits
      bits += (value & 8191) > 88 ? 13 : 14
      do {
        output.push(buffer & 255)
        buffer >>= 8
        bits -= 8
      } while (bits > 7)
      value = -1
    }
  }
  if (value >= 0) output.push((buffer | (value << bits)) & 255)
  const result = Uint8Array.from(output)
  if (encode91(result) !== text) throw new Error('非规范的 basE91 尾部分组')
  return result
}

/** Byte-oriented variants preserve leading zero bytes. Base36/62 use the displayed alphabets. */
export function encodeBytes(
  bytes: Uint8Array,
  encoding: Encoding,
  urlSafe = false,
): string {
  if (bytes.length > (['36', '58', '62'].includes(encoding) ? 8192 : 262144))
    throw new Error('输入过大：Base36/58/62 限 8 KiB，其他文本编码限 256 KiB')
  switch (encoding) {
    case '16':
      return base16.encode(bytes)
    case '32':
      return base32.encode(bytes)
    case '64':
      return (urlSafe ? base64url : base64).encode(bytes)
    case '58':
      return radixEncode(bytes, B58)
    case '36':
      return radixEncode(bytes, B36)
    case '62':
      return radixEncode(bytes, B62)
    case '45':
      return encode45(bytes)
    case '85':
      return encode85(bytes)
    case '91':
      return encode91(bytes)
  }
}
export function decodeBytes(
  text: string,
  encoding: Encoding,
  urlSafe = false,
): Uint8Array {
  if (text.length > (['36', '58', '62'].includes(encoding) ? 16384 : 600000))
    throw new Error('编码文本过大')
  switch (encoding) {
    case '16':
      return base16.decode(text.replace(/\s/g, '').toUpperCase())
    case '32': {
      const input = text.replace(/\s/g, '').toUpperCase()
      return (input.includes('=') ? base32 : base32nopad).decode(input)
    }
    case '64': {
      const input = text.replace(/\s/g, '')
      return (
        urlSafe
          ? input.includes('=')
            ? base64url
            : base64urlnopad
          : input.includes('=')
            ? base64
            : base64nopad
      ).decode(input)
    }
    case '58':
      return radixDecode(text, B58)
    case '36':
      return radixDecode(text.toLowerCase(), B36)
    case '62':
      return radixDecode(text, B62)
    case '45':
      return decode45(text)
    case '85':
      return decode85(text)
    case '91':
      return decode91(text)
  }
}

export const encodingNotes: Record<Encoding, string> = {
  '64': 'RFC 4648 · UTF-8 文本，可切换 URL-safe 字符表。',
  '32': 'RFC 4648 · 字符表 A–Z、2–7，输出带 = 填充。',
  '16': 'RFC 4648 · 十六进制字节编码，输出大写。',
  '36': `字节序列按大端整数编码；字符表 ${B36}，前导零字节保留为 0。`,
  '45': `RFC 9285 · 字符表 ${B45}；空格属于编码，解码时不会移除。`,
  '58': 'Bitcoin 字符表 · 不含 0、O、I、l；前导零字节编码为 1。',
  '62': `字节序列按大端整数编码；字符表 ${B62}，前导零字节保留为 0。`,
  '85': 'Ascii85 变体 · 支持 z 零组缩写与 <~ ~> 外框；不是 Z85。',
  '91': 'Joachim Henke basE91 字符表 · 不忽略空白。',
}

export function convertInteger(
  input: string,
  from: number,
  to: number,
): string {
  if (
    ![from, to].every(
      (value) => Number.isInteger(value) && value >= 2 && value <= 36,
    )
  )
    throw new Error('进制必须是 2–36 之间的整数')
  const text = input.trim().toLowerCase()
  if (text.length > 10000) throw new Error('整数最多 10,000 位')
  if (!/^[+-]?[0-9a-z]+$/.test(text))
    throw new Error('请输入整数，可带正负号；不要包含前缀、小数或分隔符')
  const negative = text.startsWith('-'),
    digits = text.replace(/^[+-]/, '')
  let value = 0n
  for (const char of digits) {
    const digit = B36.indexOf(char)
    if (digit >= from) throw new Error(`${char} 不是 ${from} 进制的有效数字`)
    value = value * BigInt(from) + BigInt(digit)
  }
  return (
    (negative && value !== 0n ? '-' : '') + value.toString(to).toUpperCase()
  )
}
