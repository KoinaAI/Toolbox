import assert from 'node:assert/strict'
import test from 'node:test'
import {formatScaled,generatePasswords,randomNumbers,scaledInteger} from './generators.ts'

test('cryptographic generators respect constraints without modulo shortcuts',()=>{
  assert.deepEqual(new Set(randomNumbers(-2n,2n,5,true)),new Set([-2n,-1n,0n,1n,2n]))
  assert.throws(()=>randomNumbers(1n,2n,3,true))
  assert.equal(formatScaled(scaledInteger('-1.25',2),2),'-1.25')
  for(const password of generatePasswords(20,5,['lower','upper','digits','symbols'],true)){
    assert.equal(password.length,20);assert.match(password,/[a-z]/);assert.match(password,/[A-Z]/);assert.match(password,/\d/);assert.match(password,/[^A-Za-z0-9]/);assert.doesNotMatch(password,/[Il1O0o|]/)
  }
})
