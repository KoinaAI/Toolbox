import {useState} from 'react'
import {Button} from '@heroui/react'
import Bowser from 'bowser'
import statuses from '../data/http-status.json'
import {Field,KeyValues,Notice,Result,SelectField,useOperation} from '../shared'

export function URLParser(){
  const [input,setInput]=useState(''),[result,setResult]=useState<URL|null>(null)
  const op=useOperation()
  return <div className="utility-stack"><Field label="完整 URL" value={input} onChange={setInput} maxLength={65536}/><div className="utility-actions"><Button onPress={()=>op.run(()=>setResult(new URL(input.trim())))}>解析</Button></div><Notice error>{op.error}</Notice>{result&&<><KeyValues values={[["规范化 URL",result.href],["协议",result.protocol],["来源",result.origin],["主机名",result.hostname],["端口",result.port||'默认 / 未指定'],["路径",result.pathname],["查询字符串",result.search||'无'],["片段",result.hash||'无'],["用户名",result.username||'无'],["密码",result.password?'已提供（请勿在 URL 中传递密码）':'无']]} /><Result label="查询参数（保留重复键）" value={JSON.stringify([...result.searchParams].map(([key,value])=>({key,value})),null,2)}/></>}<Notice>按 WHATWG URL 标准解析和规范化，不访问目标地址。请包含协议；查询参数中的 + 会按表单规则解析为空格。</Notice></div>
}
export function UserAgent(){
  const [input,setInput]=useState(''),[result,setResult]=useState<ReturnType<typeof Bowser.parse>|null>(null)
  const op=useOperation()
  return <div className="utility-stack"><Field label="User-Agent" value={input} onChange={setInput} multiline maxLength={8192}/><div className="utility-actions"><Button onPress={()=>op.run(()=>{if(!input.trim())throw new Error('请输入 User-Agent');setResult(Bowser.parse(input))})}>解析</Button><Button variant="secondary" onPress={()=>{setInput(navigator.userAgent);setResult(Bowser.parse(navigator.userAgent));op.setError('')}}>使用当前浏览器</Button></div><Notice error>{op.error}</Notice>{result&&<><KeyValues values={[["浏览器",[result.browser.name,result.browser.version].filter(Boolean).join(' ')||'无法识别'],["系统",[result.os.name,result.os.version,result.os.versionName].filter(Boolean).join(' ')||'无法识别'],["设备类型",result.platform.type||'无法识别'],["设备厂商",result.platform.vendor||'无法识别'],["设备型号",result.platform.model||'无法识别'],["引擎",[result.engine.name,result.engine.version].filter(Boolean).join(' ')||'无法识别']]} /><Result label="结构化结果" value={JSON.stringify(result,null,2)}/></>}<Notice>使用 Bowser 规则在本地解析。UA 可被修改，浏览器也可能缩减信息，结果不能作为设备真实性证明。</Notice></div>
}
export function HTTPStatus(){
  const [search,setSearch]=useState(''),[family,setFamily]=useState('all')
  const terms=search.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const items=statuses.items.filter(item=>(family==='all'||String(item.code)[0]===family)&&terms.every(term=>`${item.code} ${item.reason} ${item.description}`.toLowerCase().includes(term)))
  return <div className="utility-stack"><div className="utility-columns"><Field label="搜索状态码或含义" value={search} onChange={setSearch}/><SelectField label="类别" value={family} onChange={setFamily} options={[["all","全部"],["1","1xx · 信息"],["2","2xx · 成功"],["3","3xx · 重定向"],["4","4xx · 客户端错误"],["5","5xx · 服务端错误"]]}/></div><p className="utility-notice">共 {items.length} 条匹配</p><div className="utility-scroll"><table className="utility-table"><thead><tr><th>状态码</th><th>标准名称</th><th>含义</th></tr></thead><tbody>{items.map(item=><tr key={item.code}><td className="utility-code">{item.code}</td><td>{item.reason}</td><td>{item.description}</td></tr>)}</tbody></table>{!items.length&&<Notice>没有匹配的已登记状态码。</Notice>}</div><Notice>IANA HTTP Status Code Registry 快照：{statuses.retrievedAt}。保留、未使用和临时登记状态按注册表说明显示；非标准扩展码不作为标准收录。</Notice></div>
}
