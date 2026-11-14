import { formatJSON, formatSQL } from '../core/format'
import type { SqlLanguage } from 'sql-formatter'

self.onmessage=(event:MessageEvent<{mode:'json'|'sql';input:string;indent:number;minify:boolean;dialect:SqlLanguage}>)=>{
  try{
    const {mode,input,indent,minify,dialect}=event.data
    self.postMessage({result:mode==='json'?formatJSON(input,indent,minify):formatSQL(input,dialect,indent)})
  }catch(error){self.postMessage({error:error instanceof Error?error.message:'格式化失败'})}
}
