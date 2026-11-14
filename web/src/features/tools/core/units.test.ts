import assert from 'node:assert/strict'
import test from 'node:test'
import {convertUnit} from './units.ts'
test('unit offsets and scale factors are explicit',()=>{
  assert.equal(convertUnit('1','length','in','m'),.0254)
  assert.ok(Math.abs(convertUnit('32','temperature','F','C'))<1e-10)
  assert.equal(convertUnit('1','data','GiB','B'),1073741824)
  assert.throws(()=>convertUnit('-274','temperature','C','K'))
})
