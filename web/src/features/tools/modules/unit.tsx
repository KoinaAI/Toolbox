import {useState} from 'react'
import {Button} from '@heroui/react'
import {convertUnit,unitGroups} from '../core/units'
import {Field,Notice,Result,SelectField,useOperation} from '../shared'
export default function UnitConverter(){
  const [group,setGroup]=useState('length'),[from,setFrom]=useState('m'),[to,setTo]=useState('km'),[input,setInput]=useState(''),[result,setResult]=useState('')
  const current=unitGroups.find(item=>item.id===group)!,op=useOperation()
  const options=current.units.map(unit=>[unit.id,unit.label] as const)
  return <div className="utility-stack"><SelectField label="换算类别" value={group} onChange={id=>{const item=unitGroups.find(group=>group.id===id)!;setGroup(id);setFrom(item.units[0].id);setTo(item.units[1].id);setResult('');op.setError('')}} options={unitGroups.map(group=>[group.id,group.label])}/><Field label="数值" value={input} onChange={setInput} maxLength={100}/><div className="utility-columns"><SelectField label="原单位" value={from} onChange={setFrom} options={options}/><SelectField label="目标单位" value={to} onChange={setTo} options={options}/></div><div className="utility-actions"><Button onPress={()=>op.run(()=>{const value=convertUnit(input,group,from,to);setResult(`${value.toLocaleString('en-US',{maximumSignificantDigits:15,useGrouping:false})} ${current.units.find(unit=>unit.id===to)!.label}`)})}>换算</Button><Button variant="ghost" onPress={()=>{setFrom(to);setTo(from);setResult('')}}>交换单位</Button></div><Notice error>{op.error}</Notice><Result value={result}/><Notice>采用双精度数值，结果最多显示 15 位有效数字。时间长度中的“天”固定为 24 小时；日历日期请使用日期计算器。</Notice></div>
}
