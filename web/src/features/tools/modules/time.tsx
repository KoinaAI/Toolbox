import { useState } from 'react'
import { Button } from '@heroui/react'
import { Temporal } from '@js-temporal/polyfill'
import {
  dateDifference,
  epochSeconds,
  localZone,
  timestampInstant,
  zonedDateTime,
  zones,
} from '../core/time'
import {
  Field,
  KeyValues,
  Notice,
  Result,
  SelectField,
  Toggle,
  useOperation,
} from '../shared'

export function Timestamp() {
  const [stamp, setStamp] = useState(''),
    [unit, setUnit] = useState('s'),
    [date, setDate] = useState(''),
    [zone, setZone] = useState(localZone),
    [result, setResult] = useState('')
  const op = useOperation()
  function show(instant: Temporal.Instant) {
    setResult(
      `Unix 秒：${epochSeconds(instant)}\nUnix 毫秒：${instant.epochMilliseconds}\nUTC：${instant.toString()}\n${zone}：${instant.toZonedDateTimeISO(zone).toString()}`,
    )
  }
  return (
    <div className="utility-stack">
      <SelectField
        label="日期使用的时区"
        value={zone}
        onChange={setZone}
        options={zones}
      />
      <div className="utility-columns">
        <Field
          label="Unix 时间戳"
          value={stamp}
          onChange={setStamp}
          maxLength={40}
        />
        <SelectField
          label="时间戳单位"
          value={unit}
          onChange={setUnit}
          options={[
            ['s', '秒'],
            ['ms', '毫秒'],
            ['auto', '自动（13 位起按毫秒）'],
          ]}
        />
      </div>
      <div className="utility-actions">
        <Button
          onPress={() =>
            op.run(() =>
              show(
                timestampInstant(stamp, unit as 's' | 'ms' | 'auto').instant,
              ),
            )
          }
        >
          转为日期
        </Button>
        <Button
          variant="secondary"
          onPress={() =>
            op.run(() => {
              const now = Temporal.Now.instant()
              setStamp(
                unit === 'ms'
                  ? String(now.epochMilliseconds)
                  : String(now.epochNanoseconds / 1000000000n),
              )
              show(now)
            })
          }
        >
          当前时间
        </Button>
      </div>
      <Field
        label="日期时间"
        value={date}
        onChange={setDate}
        type="datetime-local"
      />
      <div className="utility-actions">
        <Button
          variant="secondary"
          onPress={() =>
            op.run(() => show(zonedDateTime(date, zone).toInstant()))
          }
        >
          转为时间戳
        </Button>
      </div>
      <Notice error>{op.error}</Notice>
      <Result value={result} />
      <Notice>
        夏令时重复或不存在的本地时间会报错，请在时区转换工具中指定歧义处理。Unix
        秒取整数，毫秒以下的小数不会四舍五入。
      </Notice>
    </div>
  )
}

export function DateCalculator() {
  const [mode, setMode] = useState('diff'),
    [start, setStart] = useState(''),
    [end, setEnd] = useState(''),
    [amount, setAmount] = useState('1'),
    [unit, setUnit] = useState('days'),
    [inclusive, setInclusive] = useState(false),
    [result, setResult] = useState('')
  const op = useOperation()
  return (
    <div className="utility-stack">
      <div className="utility-segments">
        <Button
          variant={mode === 'diff' ? 'secondary' : 'ghost'}
          onPress={() => setMode('diff')}
        >
          日期间隔
        </Button>
        <Button
          variant={mode === 'offset' ? 'secondary' : 'ghost'}
          onPress={() => setMode('offset')}
        >
          日期加减
        </Button>
      </div>
      <Field label="起始日期" value={start} onChange={setStart} type="date" />
      {mode === 'diff' ? (
        <>
          <Field label="结束日期" value={end} onChange={setEnd} type="date" />
          <Toggle
            label="包含起止两天"
            value={inclusive}
            onChange={setInclusive}
          />
        </>
      ) : (
        <div className="utility-columns">
          <Field
            label="增减数量（负数表示向前）"
            value={amount}
            onChange={setAmount}
            type="number"
          />
          <SelectField
            label="单位"
            value={unit}
            onChange={setUnit}
            options={[
              ['days', '天'],
              ['weeks', '周'],
              ['months', '月'],
              ['years', '年'],
            ]}
          />
        </div>
      )}
      <div className="utility-actions">
        <Button
          onPress={() =>
            op.run(() => {
              if (mode === 'diff') {
                const days = dateDifference(start, end, inclusive)
                setResult(
                  `${days} 天\n绝对间隔：${Math.abs(days)} 天\n约 ${(Math.abs(days) / 7).toFixed(2)} 周`,
                )
              } else {
                if (
                  !/^[+-]?\d+$/.test(amount) ||
                  Math.abs(Number(amount)) > 1000000
                )
                  throw new Error('数量必须是绝对值不超过一百万的整数')
                setResult(
                  Temporal.PlainDate.from(start)
                    .add({ [unit]: Number(amount) }, { overflow: 'constrain' })
                    .toString(),
                )
              }
            })
          }
        >
          计算
        </Button>
      </div>
      <Notice error>{op.error}</Notice>
      <Result value={result} />
      <Notice>
        使用公历日历计算，不把一天当作固定 24
        小时。月份或年份加减遇到不存在的日期时取目标月最后一天。
      </Notice>
    </div>
  )
}

export function Timezone() {
  const [date, setDate] = useState(''),
    [from, setFrom] = useState(localZone),
    [to, setTo] = useState('UTC'),
    [disambiguation, setDisambiguation] = useState('reject'),
    [result, setResult] = useState<Temporal.ZonedDateTime | null>(null)
  const op = useOperation()
  return (
    <div className="utility-stack">
      <Field
        label="原时区的本地日期时间"
        value={date}
        onChange={setDate}
        type="datetime-local"
      />
      <div className="utility-columns">
        <SelectField
          label="原时区"
          value={from}
          onChange={setFrom}
          options={zones}
        />
        <SelectField
          label="目标时区"
          value={to}
          onChange={setTo}
          options={zones}
        />
      </div>
      <SelectField
        label="夏令时歧义处理"
        value={disambiguation}
        onChange={setDisambiguation}
        options={[
          ['reject', '报错（默认）'],
          ['earlier', '采用较早时刻'],
          ['later', '采用较晚时刻'],
        ]}
      />
      <div className="utility-actions">
        <Button
          onPress={() =>
            op.run(() =>
              setResult(
                zonedDateTime(
                  date,
                  from,
                  disambiguation as 'reject' | 'earlier' | 'later',
                ).withTimeZone(to),
              ),
            )
          }
        >
          转换
        </Button>
        <Button
          variant="ghost"
          onPress={() => {
            setFrom(to)
            setTo(from)
          }}
        >
          交换时区
        </Button>
      </div>
      <Notice error>{op.error}</Notice>
      {result && (
        <>
          <Result label="目标日期时间" value={result.toString()} />
          <KeyValues
            values={[
              ['UTC', result.toInstant().toString()],
              ['UTC 偏移', result.offset],
              ['Unix 毫秒', String(result.epochMilliseconds)],
            ]}
          />
        </>
      )}
      <Notice>
        使用 IANA 时区规则处理历史偏移和夏令时；规则版本随当前浏览器的 Intl
        数据更新。
      </Notice>
    </div>
  )
}

export function Cron() {
  const [input, setInput] = useState(''),
    [zone, setZone] = useState(localZone),
    [start, setStart] = useState(''),
    [description, setDescription] = useState(''),
    [result, setResult] = useState('')
  const op = useOperation()
  return (
    <div className="utility-stack">
      <Field
        label="Cron 表达式"
        value={input}
        onChange={setInput}
        placeholder="分 时 日 月 周，或 秒 分 时 日 月 周"
        maxLength={256}
      />
      <SelectField
        label="执行时区"
        value={zone}
        onChange={setZone}
        options={zones}
      />
      <Field
        label="从此日期时间开始（留空使用当前时间）"
        value={start}
        onChange={setStart}
        type="datetime-local"
      />
      <div className="utility-actions">
        <Button
          isPending={op.busy}
          onPress={() =>
            op.run(async () => {
              const fields = input.trim().split(/\s+/)
              if (![5, 6].includes(fields.length))
                throw new Error(
                  '支持 5 字段或含秒的 6 字段 Cron，不支持年份字段',
                )
              if (/\bH\b/i.test(input))
                throw new Error('不支持随机哈希字段 H，请使用确定的数值或范围')
              const { CronExpressionParser } = await import('cron-parser')
              const { default: cronstrue } = await import('cronstrue')
              await import('cronstrue/locales/zh_CN')
              const currentDate = start
                ? new Date(zonedDateTime(start, zone).epochMilliseconds)
                : new Date()
              const expression = CronExpressionParser.parse(input, {
                currentDate,
                tz: zone,
              })
              const dates = Array.from({ length: 10 }, () =>
                expression.next().toDate(),
              )
              let summary = '表达式校验通过'
              try {
                summary = cronstrue.toString(input, {
                  locale: 'zh_CN',
                  use24HourTimeFormat: true,
                })
              } catch {
                /* Preview remains authoritative for dialect-specific expressions. */
              }
              setDescription(summary)
              setResult(
                dates
                  .map(
                    (date, i) =>
                      `${i + 1}. ${Temporal.Instant.fromEpochMilliseconds(date.getTime()).toZonedDateTimeISO(zone).toString()}`,
                  )
                  .join('\n'),
              )
            })
          }
        >
          解析并预览
        </Button>
      </div>
      <Notice error>{op.error}</Notice>
      {!op.error && !op.busy && description && (
        <Notice tone="success">{description}</Notice>
      )}
      <Result label="接下来 10 次执行时间" value={result} />
      <Notice>
        支持 *、范围、步长和列表；周日为 0 或 7。日期与星期同时受限时采用
        cron-parser 的 OR 语义。结果仅预览，不会创建定时任务。
      </Notice>
    </div>
  )
}
