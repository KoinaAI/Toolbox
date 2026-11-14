import { useMemo, useState } from 'react'
import { Button } from '@heroui/react'
import { areaList } from '@vant/area-data'
import { checkIdentity, countText, parseJWT } from '../core/text'
import {
  Field,
  KeyValues,
  Notice,
  Result,
  Toggle,
  useOperation,
} from '../shared'

export function Identity() {
  const [input, setInput] = useState(''),
    [parse, setParse] = useState(false),
    [result, setResult] = useState<ReturnType<typeof checkIdentity> | null>(
      null,
    )
  const op = useOperation()
  const region = result
    ? [
        areaList.province_list[result.regionCode.slice(0, 2) + '0000'],
        areaList.city_list[result.regionCode.slice(0, 4) + '00'],
        areaList.county_list[result.regionCode],
      ]
        .filter(Boolean)
        .filter(
          (value, index, items) => index === 0 || value !== items[index - 1],
        )
        .join(' / ')
    : ''
  return (
    <div className="utility-stack">
      <Field
        label="18 位居民身份证号"
        value={input}
        maxLength={32}
        onChange={(value) => {
          setInput(value)
          setResult(null)
          op.setError('')
        }}
      />
      <Toggle
        label="解析地址码、生日和性别"
        value={parse}
        onChange={setParse}
      />
      <div className="utility-actions">
        <Button onPress={() => op.run(() => setResult(checkIdentity(input)))}>
          校验
        </Button>
        <Button
          variant="ghost"
          onPress={() => {
            setInput('')
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
          <Notice tone={result.valid ? 'success' : 'error'}>
            {result.valid
              ? '校验通过：末位校验码符合 MOD 11-2 规则。'
              : `校验未通过：末位应为 ${result.expected}，当前为 ${result.actual}。`}
          </Notice>
          {parse && (
            <KeyValues
              values={[
                ['地址码地区', region || '当前区划数据未收录'],
                ['地址码', result.regionCode],
                ['生日', result.birthday],
                ['性别', result.sex],
              ]}
            />
          )}
        </>
      )}
      <Notice>
        仅在浏览器计算，不上传或保存号码；规则校验不代表证件真实或有效。地址码表示登记地区，不等同实际出生地。区划来自
        @vant/area-data 2.2.0，历史区划可能未收录。
      </Notice>
    </div>
  )
}

export function JWT() {
  const [input, setInput] = useState(''),
    [result, setResult] = useState<ReturnType<typeof parseJWT> | null>(null)
  const op = useOperation()
  const now = Date.now() / 1000
  const dateClaim = (key: string) => {
    const value = result?.payload[key]
    if (value === undefined) return '未提供'
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      !Number.isFinite(new Date(value * 1000).getTime())
    )
      return '不是合法的 NumericDate'
    return (
      new Date(value * 1000).toISOString() +
      (key === 'exp'
        ? now >= value
          ? '（已过期）'
          : '（尚未到期）'
        : key === 'nbf' && now < value
          ? '（尚未生效）'
          : '')
    )
  }
  return (
    <div className="utility-stack">
      <Notice>
        仅解码，不验证签名、算法或签发来源。切勿据此作登录或权限判断。
      </Notice>
      <Field
        label="JWT"
        value={input}
        onChange={(value) => {
          setInput(value)
          setResult(null)
          op.setError('')
        }}
        multiline
        maxLength={262144}
      />
      <div className="utility-actions">
        <Button onPress={() => op.run(() => setResult(parseJWT(input)))}>
          解析
        </Button>
        <Button
          variant="ghost"
          onPress={() => {
            setInput('')
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
          <Result
            label="Header"
            value={JSON.stringify(result.header, null, 2)}
          />
          <Result
            label="Payload"
            value={JSON.stringify(result.payload, null, 2)}
          />
          <Result
            label="签名段（Base64URL，未验证）"
            value={result.signature || '空签名'}
          />
          <KeyValues
            values={[
              ['过期时间 exp', dateClaim('exp')],
              ['生效时间 nbf', dateClaim('nbf')],
              ['签发时间 iat', dateClaim('iat')],
            ]}
          />
          {result.header.alg === 'none' && (
            <Notice error>alg 为 none：此令牌没有可验证的签名保护。</Notice>
          )}
        </>
      )}
      <Notice>令牌只在当前页面内存中处理，不会上传或写入浏览器存储。</Notice>
    </div>
  )
}

export function WordCount() {
  const [input, setInput] = useState(''),
    [punctuation, setPunctuation] = useState(false)
  const count = useMemo(() => countText(input), [input])
  return (
    <div className="utility-stack">
      <Field
        label="待统计文本"
        value={input}
        onChange={setInput}
        multiline
        maxLength={500000}
      />
      <Toggle
        label="总计包含标点符号"
        value={punctuation}
        onChange={setPunctuation}
      />
      <div className="utility-total">
        <strong>
          {(
            count.total + (punctuation ? count.punctuation : 0)
          ).toLocaleString()}
        </strong>
        <span>字 / 词{punctuation ? ' / 标点' : ''}</span>
      </div>
      <KeyValues
        values={[
          ['汉字', count.han],
          ['英文单词', count.latin],
          ['其他语言词', count.other],
          ['数字词', count.numbers],
          ['标点', count.punctuation],
          ['字符（含空白）', count.characters],
          ['字符（不含空白）', count.nonWhitespace],
          ['行', count.lines],
          ['段落', count.paragraphs],
          ['UTF-8 字节', count.bytes],
        ]}
      />
      <Notice>
        汉字逐字计数，英文与其他文字按 Intl.Segmenter
        分词，中英混合分别累加。数字串计一个数字词；符号和 Emoji
        不计入字词。字符按用户可见字素统计，空行分隔段落。
      </Notice>
    </div>
  )
}
