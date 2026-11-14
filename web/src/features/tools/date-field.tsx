import { Calendar, DatePicker, Label } from '@heroui/react'
import { DateInputGroup } from '@heroui/react/date-input-group'
import {
  getLocalTimeZone,
  parseDate,
  parseDateTime,
  today,
  toCalendarDateTime,
} from '@internationalized/date'
import { I18nProvider } from 'react-aria-components'

/** Calendar and time segments use the same HeroUI surface as the other tool inputs. */
export function DateControl({
  label,
  value,
  onChange,
  includeTime,
  readOnly,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  includeTime: boolean
  readOnly: boolean
}) {
  const reference = today(getLocalTimeZone())
  return (
    <I18nProvider locale="zh-CN">
      <DatePicker
        className="utility-field"
        value={
          value ? (includeTime ? parseDateTime(value) : parseDate(value)) : null
        }
        placeholderValue={
          includeTime ? toCalendarDateTime(reference) : reference
        }
        onChange={(date) => onChange?.(date?.toString() || '')}
        granularity={includeTime ? 'second' : 'day'}
        hourCycle={24}
        isReadOnly={readOnly}
      >
        <Label>{label}</Label>
        <DateInputGroup variant="secondary" fullWidth>
          <DateInputGroup.Input>
            {(segment) => <DateInputGroup.Segment segment={segment} />}
          </DateInputGroup.Input>
          <DateInputGroup.Suffix>
            <DatePicker.Trigger aria-label={`选择${label}`}>
              <DatePicker.TriggerIndicator />
            </DatePicker.Trigger>
          </DateInputGroup.Suffix>
        </DateInputGroup>
        <DatePicker.Popover>
          <Calendar aria-label={label}>
            <Calendar.Header>
              <Calendar.NavButton slot="previous" />
              <Calendar.Heading />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>
                {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
              </Calendar.GridHeader>
              <Calendar.GridBody>
                {(date) => <Calendar.Cell date={date} />}
              </Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
        </DatePicker.Popover>
      </DatePicker>
    </I18nProvider>
  )
}
