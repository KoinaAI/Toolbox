import assert from 'node:assert/strict'
import test from 'node:test'
import { convertUnit } from './units.ts'
test('unit offsets and scale factors are explicit', () => {
  assert.equal(convertUnit('1', 'length', 'in', 'm'), 0.0254)
  assert.ok(Math.abs(convertUnit('32', 'temperature', 'F', 'C')) < 1e-10)
  assert.equal(convertUnit('1', 'data', 'GiB', 'B'), 1073741824)
  assert.throws(() => convertUnit('-274', 'temperature', 'C', 'K'))
})
test('unit conversion preserves tiny values and finite large ratios', () => {
  assert.equal(convertUnit('1e-16', 'length', 'm', 'm'), 1e-16)
  assert.ok(Math.abs(convertUnit('1e-13', 'length', 'mm', 'm') / 1e-16 - 1) < 1e-15)
  assert.equal(convertUnit('1e308', 'length', 'km', 'km'), 1e308)
  assert.equal(convertUnit('1e308', 'length', 'km', 'mi'), 1e308 * (1000 / 1609.344))
  assert.equal(Object.is(convertUnit('-0', 'length', 'm', 'm'), -0), false)
})
