/** Rejection sampling avoids modulo bias for every supported integer interval. */
export function randomInteger(min: bigint, max: bigint): bigint {
  if (max < min) throw new Error('上限不能小于下限')
  const range = max-min+1n
  if (range > 1n<<256n) throw new Error('区间不能超过 256 位整数')
  if (range===1n) return min
  const bits=(range-1n).toString(2).length, bytes=Math.ceil(bits/8)
  const buffer=new Uint8Array(bytes)
  let value:bigint
  do { crypto.getRandomValues(buffer);buffer[0]&=255>>>(bytes*8-bits);value=0n;for(const byte of buffer)value=value*256n+BigInt(byte) }while(value>=range)
  return min+value
}
export function shuffle<T>(values:T[]):T[]{for(let i=values.length-1;i>0;i--){const j=Number(randomInteger(0n,BigInt(i)));[values[i],values[j]]=[values[j],values[i]]}return values}

export function randomNumbers(min:bigint,max:bigint,count:number,unique=false):bigint[]{
  if(!Number.isInteger(count)||count<1||count>1000)throw new Error('数量必须为 1–1000')
  if(max<min)throw new Error('上限不能小于下限')
  const span=max-min+1n
  if(span>1n<<256n)throw new Error('区间不能超过 256 位整数')
  if(!unique)return Array.from({length:count},()=>randomInteger(min,max))
  if(BigInt(count)>span)throw new Error('唯一结果数量超过区间内可用数字数量')
  const chosen=new Set<bigint>()
  for(let cursor=span-BigInt(count);cursor<span;cursor++){const candidate=randomInteger(0n,cursor);chosen.add(chosen.has(candidate)?cursor:candidate)}
  return shuffle([...chosen].map(value=>value+min))
}

export const passwordSets={lower:'abcdefghijklmnopqrstuvwxyz',upper:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',digits:'0123456789',symbols:'!@#$%^&*()-_=+[]{};:,.?/~'}
export function generatePasswords(length:number,count:number,groups:(keyof typeof passwordSets)[],excludeAmbiguous:boolean):string[]{
  if(!Number.isInteger(length)||length<1||length>256||!Number.isInteger(count)||count<1||count>50)throw new Error('密码长度为 1–256，数量为 1–50')
  const sets=groups.map(key=>excludeAmbiguous?passwordSets[key].replace(/[Il1O0o|]/g,''):passwordSets[key])
  if(!sets.length)throw new Error('至少选择一种字符类型')
  if(length<sets.length)throw new Error('长度必须足以包含每种选中的字符类型')
  const pool=sets.join(''),pick=(set:string)=>set[Number(randomInteger(0n,BigInt(set.length-1)))]
  return Array.from({length:count},()=>{const chars=sets.map(pick);while(chars.length<length)chars.push(pick(pool));return shuffle(chars).join('')})
}

export function scaledInteger(text:string,precision:number):bigint{
  const value=text.trim()
  if(!/^[+-]?\d+(?:\.\d+)?$/.test(value)||value.length>80)throw new Error('请输入有效数字，不使用指数或分隔符')
  const [whole,fraction='']=value.replace(/^[+-]/,'').split('.')
  if(fraction.length>precision)throw new Error(`输入最多支持 ${precision} 位小数`)
  return(BigInt(whole)*10n**BigInt(precision)+BigInt(fraction.padEnd(precision,'0')))*(value.startsWith('-')?-1n:1n)
}
export function formatScaled(value:bigint,precision:number):string{
  const negative=value<0n,raw=(negative?-value:value).toString().padStart(precision+1,'0')
  return(negative?'-':'')+(precision?raw.slice(0,-precision)+'.'+raw.slice(-precision):raw)
}
