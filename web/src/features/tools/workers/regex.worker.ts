import {testRegex} from '../core/regex'
self.onmessage=(event:MessageEvent<{pattern:string;flags:string;input:string}>)=>{
  try{const{pattern,flags,input}=event.data;self.postMessage({result:testRegex(pattern,flags,input)})}catch(error){self.postMessage({error:error instanceof Error?error.message:'表达式执行失败'})}
}
