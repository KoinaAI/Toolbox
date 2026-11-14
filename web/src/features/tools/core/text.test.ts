import assert from 'node:assert/strict'
import test from 'node:test'
import { checkIdentity, countText, parseJWT } from './text.ts'

test('resident ID checks are independent of optional information display', () => {
  const data = checkIdentity('11010519491231002x')
  assert.equal(data.valid, true)
  assert.equal(data.birthday, '1949-12-31')
  assert.equal(data.sex, '女')
  assert.equal(checkIdentity('110105194912310020').valid, false)
  assert.throws(() => checkIdentity('11010520230229002X'))
  assert.throws(() => checkIdentity('11010519491231000X'))
})

test('mixed language counts use Han characters and Latin words', () => {
  const result = countText('你好，hello world! 世界。')
  assert.equal(result.han, 4)
  assert.equal(result.latin, 2)
  assert.equal(result.punctuation, 3)
  assert.equal(result.total, 6)
  assert.equal(countText('👨‍👩‍👧‍👦').characters, 1)
  assert.throws(() => parseJWT('abc.def'))
  assert.throws(() => parseJWT('eyJhbGciOiJub25lIn0.e30.AA'))
  assert.equal(countText('你好\r\r世界').paragraphs, 2)
})
