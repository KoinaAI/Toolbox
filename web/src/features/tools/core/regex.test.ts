import assert from 'node:assert/strict'
import test from 'node:test'
import {testRegex} from './regex.ts'

test('regex zero-width Unicode matches progress and named captures are returned',()=>{
  assert.equal(testRegex('(?:)','gu','😀').matches.length,2)
  assert.equal(testRegex('(?<word>\\w+)','g','hello world').matches[0].named.word,'hello')
  assert.throws(()=>testRegex('[','g','x'))
  assert.throws(()=>testRegex('x','gg','x'))
})
