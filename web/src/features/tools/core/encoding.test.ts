import assert from 'node:assert/strict'
import test from 'node:test'
import { convertInteger, decodeBytes, encodeBytes, ENCODINGS } from './encoding.ts'

test('RFC encodings and nonstandard variants preserve byte boundaries', () => {
  const bytes = new TextEncoder().encode('AB')
  assert.equal(encodeBytes(bytes,'45'),'BB8')
  assert.equal(encodeBytes(new TextEncoder().encode('Hello!!'),'45'),'%69 VD92EX0')
  assert.equal(encodeBytes(new TextEncoder().encode('Hello, world!'),'85'),'87cURD_*#TDfTZ)+T')
  assert.equal(encodeBytes(new TextEncoder().encode('test'),'91'),'fPNKd')
  assert.equal(encodeBytes(new TextEncoder().encode('foo'),'32'),'MZXW6===')
  for (const base of ENCODINGS) for (const data of [[],[0],[0,0],[1],[255],[0,1,2,3],[255,255,255,255],Array.from(new TextEncoder().encode('中英 mixed\u0000'))]) {
    assert.deepEqual([...decodeBytes(encodeBytes(Uint8Array.from(data),base),base)],data, `Base${base}: ${data}`)
  }
  assert.throws(() => decodeBytes(':::', '45'))
  assert.throws(() => decodeBytes('!', '85'))
  assert.throws(() => decodeBytes('~~~~~', '85'))
  assert.throws(() => decodeBytes(' a', '91'))
})

test('integer conversion preserves precision and validates every digit', () => {
  assert.equal(convertInteger('9007199254740993',10,16),'20000000000001')
  assert.equal(convertInteger('-zz',36,10),'-1295')
  assert.throws(() => convertInteger('102',2,10))
  assert.throws(() => convertInteger('10',1.5,10))
})

