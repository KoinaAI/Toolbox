import { useState } from 'react'
import { Button } from '@heroui/react'
import { v4, v7 } from 'uuid'
import { formatScaled,generatePasswords,passwordSets,randomNumbers,scaledInteger } from '../core/generators'
import { Field,Notice,Result,SelectField,Toggle,useOperation } from '../shared'

export function RandomNumbers(){
  const [min,setMin]=useState('0'),[max,setMax]=useState('100'),[count,setCount]=useState('1'),[precision,setPrecision]=useState('0'),[unique,setUnique]=useState(false),[result,setResult]=useState('')
  const op=useOperation()
  return <div className="utility-stack"><div className="utility-columns"><Field label="下限（包含）" value={min} onChange={setMin}/><Field label="上限（包含）" value={max} onChange={setMax}/><Field label="生成数量（1–1000）" value={count} onChange={setCount} type="number"/><SelectField label="小数位数" value={precision} onChange={setPrecision} options={Array.from({length:13},(_,i)=>[String(i),i?`${i} 位小数`:'整数'])}/></div><Toggle label="结果不重复" value={unique} onChange={setUnique}/><div className="utility-actions"><Button onPress={()=>op.run(()=>setResult(randomNumbers(scaledInteger(min,Number(precision)),scaledInteger(max,Number(precision)),Number(count),unique).map(value=>formatScaled(value,Number(precision))).join('\n')))}>生成</Button></div><Notice error>{op.error}</Notice><Result value={result}/><Notice>使用 Web Crypto 安全随机源和拒绝采样。小数是在指定精度的离散网格上均匀抽取，不使用 Math.random。</Notice></div>
}
export function Password(){
  const [length,setLength]=useState('20'),[count,setCount]=useState('1'),[groups,setGroups]=useState<(keyof typeof passwordSets)[]>(['lower','upper','digits','symbols']),[exclude,setExclude]=useState(true),[result,setResult]=useState('')
  const op=useOperation()
  return <div className="utility-stack"><div className="utility-columns"><Field label="密码长度（1–256）" value={length} onChange={setLength} type="number"/><Field label="生成数量（1–50）" value={count} onChange={setCount} type="number"/></div>{([['lower','小写字母 a–z'],['upper','大写字母 A–Z'],['digits','数字 0–9'],['symbols','符号']] as const).map(([key,label])=><Toggle key={key} label={label} value={groups.includes(key)} onChange={on=>setGroups(on?[...groups,key]:groups.filter(item=>item!==key))}/>)}<Toggle label="排除易混淆字符 I、l、1、O、0、o、|" value={exclude} onChange={setExclude}/><div className="utility-actions"><Button onPress={()=>op.run(()=>setResult(generatePasswords(Number(length),Number(count),groups,exclude).join('\n')))}>生成密码</Button><Button variant="ghost" onPress={()=>setResult('')}>清空结果</Button></div><Notice error>{op.error}</Notice><Result value={result}/><Notice>每个密码至少包含每种选中的字符类型，采用 Web Crypto 和安全洗牌。结果不上传、不保存；请在离开页面前妥善保管。</Notice></div>
}
export function UUID(){
  const [version,setVersion]=useState('4'),[count,setCount]=useState('1'),[upper,setUpper]=useState(false),[result,setResult]=useState('')
  const op=useOperation()
  return <div className="utility-stack"><div className="utility-columns"><SelectField label="UUID 版本" value={version} onChange={setVersion} options={[["4","v4 · 随机"],["7","v7 · 按时间排序"]]}/><Field label="数量（1–1000）" value={count} onChange={setCount} type="number"/></div><Toggle label="大写显示" value={upper} onChange={setUpper}/><div className="utility-actions"><Button onPress={()=>op.run(()=>{const n=Number(count);if(!Number.isInteger(n)||n<1||n>1000)throw new Error('数量必须为 1–1000');setResult(Array.from({length:n},()=>{const value=version==='7'?v7():v4();return upper?value.toUpperCase():value}).join('\n'))})}>生成 UUID</Button></div><Notice error>{op.error}</Notice><Result value={result}/><Notice>使用 uuid 库和浏览器安全随机源生成。v7 含毫秒级时间信息；UUID 不应当作访问密钥。</Notice></div>
}
