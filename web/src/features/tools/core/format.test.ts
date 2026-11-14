import assert from 'node:assert/strict'
import test from 'node:test'
import { formatJSON, formatSQL } from './format.ts'
test('JSON formatting preserves raw number and string tokens', () => {
  const input = ' {"large":90071992547409931234567890,"text":"a b"} '
  assert.match(formatJSON(input), /90071992547409931234567890/)
  assert.equal(
    formatJSON(input, 2, true),
    '{"large":90071992547409931234567890,"text":"a b"}',
  )
  assert.throws(() => formatJSON('{"a":1,}'))
  assert.throws(() => formatJSON('{/*x*/"a":1}'))
  assert.match(
    formatSQL('select id from users where id = 1', 'postgresql'),
    /SELECT\n/,
  )
})
