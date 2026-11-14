import {useEffect,useRef,useState} from 'react'
import {Button} from '@heroui/react'
import type {ToolWorkspaceProps} from '../registry'
import CodeEditor from '../monaco'
import FormatWorker from '../workers/format.worker?worker'
import {CopyButton,Notice,SelectField,useOperation} from '../shared'

export default function Formatter({tool}:ToolWorkspaceProps){
  const json=tool.id==='json', [input,setInput]=useState(''),[output,setOutput]=useState(''),[dialect,setDialect]=useState('sql'),[indent,setIndent]=useState('2')
  const worker=useRef<Worker|null>(null),op=useOperation()
  useEffect(()=>()=>{worker.current?.terminate()},[])
  async function run(minify=false){await op.run(()=>new Promise<void>((resolve,reject)=>{
    if(input.length>(json?1048576:262144)){reject(new Error(json?'JSON 输入最多 1 MiB':'SQL 输入最多 256 KiB'));return}
    const task=new FormatWorker();worker.current=task
    const finish=()=>{clearTimeout(timer);task.terminate();worker.current=null}
    const timer=window.setTimeout(()=>{finish();reject(new Error('格式化超过 8 秒，已终止；请缩小输入'))},8000)
    task.onmessage=event=>{finish();if(event.data.error)reject(new Error(event.data.error));else{setOutput(event.data.result);resolve()}}
    task.onerror=()=>{finish();reject(new Error('格式化工作线程加载失败，请刷新后重试'))}
    task.postMessage({mode:json?'json':'sql',input,indent:Number(indent),minify,dialect})
  }))}
  return <div className="utility-stack"><div className="utility-columns">{!json&&<SelectField label="SQL 方言" value={dialect} onChange={setDialect} options={[["sql","标准 SQL"],["postgresql","PostgreSQL"],["mysql","MySQL"],["sqlite","SQLite"],["transactsql","SQL Server / T-SQL"],["plsql","Oracle PL/SQL"]]}/>}<SelectField label="缩进" value={indent} onChange={setIndent} options={[["2","2 个空格"],["4","4 个空格"]]}/></div><div className="utility-result-heading"><h2>输入</h2><Button variant="ghost" size="sm" isDisabled={op.busy} onPress={()=>{setInput('');setOutput('');op.setError('')}}>清空</Button></div><CodeEditor label={`${json?'JSON':'SQL'} 输入编辑器`} value={input} onChange={setInput} language={json?'json':'sql'}/><div className="utility-actions"><Button isPending={op.busy} onPress={()=>run()}>格式化</Button>{json&&<Button variant="secondary" isDisabled={op.busy} onPress={()=>run(true)}>压缩</Button>}<Button variant="ghost" isDisabled={!output||op.busy} onPress={()=>{setInput(output);setOutput('')}}>结果作为输入</Button></div><Notice error>{op.error}</Notice><div className="utility-result-heading"><h2>输出</h2><CopyButton value={output}/></div><CodeEditor label={`${json?'JSON':'SQL'} 输出编辑器`} value={output} language={json?'json':'sql'} readOnly/><Notice>{json?'严格校验 JSON，保留大整数原文字面量；不接受注释或尾随逗号。':'按所选方言格式化，不连接数据库或执行 SQL。'} Monaco、语言服务和格式化线程均由本站本地资源加载，输入不上传。</Notice></div>
}
