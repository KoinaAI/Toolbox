import assert from 'node:assert/strict'
import test from 'node:test'
import {dateDifference,timestampInstant,zonedDateTime} from './time.ts'

test('date operations respect calendar boundaries and DST ambiguity',()=>{
  assert.equal(timestampInstant('0','s').instant.toString(),'1970-01-01T00:00:00Z')
  assert.equal(timestampInstant('-0.001','s').instant.epochMilliseconds,-1)
  assert.equal(dateDifference('2024-02-28','2024-03-01'),2)
  assert.equal(dateDifference('2024-03-01','2024-02-28',true),-3)
  assert.throws(()=>zonedDateTime('2026-03-08T02:30','America/New_York'))
  assert.throws(()=>zonedDateTime('2026-11-01T01:30','America/New_York'))
})
