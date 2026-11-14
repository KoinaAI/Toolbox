import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor/editor/editor.api'
import { jsonDefaults } from 'monaco-editor/languages/features/json/register'
import 'monaco-editor/languages/definitions/sql/register'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import JSONWorker from 'monaco-editor/languages/features/json/json.worker?worker'

;(self as typeof self & {MonacoEnvironment:monaco.Environment}).MonacoEnvironment={getWorker(_id,label){return label==='json'?new JSONWorker():new EditorWorker()}}
jsonDefaults.setDiagnosticsOptions({validate:true,allowComments:false,trailingCommas:'error',enableSchemaRequest:false})

/** Each mounted editor owns and disposes its model, listeners and layout observer. All workers are local build assets. */
export default function CodeEditor({value,onChange,language,readOnly=false,label}:{value:string;onChange?:(value:string)=>void;language:'json'|'sql';readOnly?:boolean;label:string}){
  const element=useRef<HTMLDivElement>(null),editor=useRef<monaco.editor.IStandaloneCodeEditor|null>(null),onChangeRef=useRef(onChange),valueRef=useRef(value)
  onChangeRef.current=onChange;valueRef.current=value
  useEffect(()=>{
    if(!element.current)return
    const model=monaco.editor.createModel(valueRef.current,language)
    const instance=monaco.editor.create(element.current,{model,readOnly,automaticLayout:true,minimap:{enabled:false},fontSize:13,lineHeight:22,wordWrap:'on',scrollBeyondLastLine:false,padding:{top:14,bottom:14},ariaLabel:label,tabSize:2,renderLineHighlight:'none',fixedOverflowWidgets:true,stickyScroll:{enabled:false}})
    editor.current=instance
    const listener=instance.onDidChangeModelContent(()=>onChangeRef.current?.(instance.getValue()))
    const theme=()=>monaco.editor.setTheme(document.documentElement.classList.contains('dark')?'vs-dark':'vs')
    theme();const observer=new MutationObserver(theme);observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']})
    return()=>{observer.disconnect();listener.dispose();instance.dispose();model.dispose();editor.current=null}
  },[language,readOnly,label])
  useEffect(()=>{if(editor.current&&editor.current.getValue()!==value)editor.current.setValue(value)},[value])
  return <div ref={element} className="utility-editor"/>
}
