import { RegExpParser,visitRegExpAST } from '@eslint-community/regexpp'

export type RegexResult={matches:{index:number;end:number;text:string;groups:(string|null)[];named:Record<string,string|null>}[];syntax:string[];truncated:boolean;source:string;flags:string}
/** Executed only in a disposable worker in the application; the caller enforces a wall-clock timeout. */
export function testRegex(pattern:string,flags:string,input:string):RegexResult{
  if(pattern.length>4096||input.length>262144)throw new Error('表达式最多 4096 字符，测试文本最多 256 KiB')
  if(!/^[dgimsuvy]*$/.test(flags)||new Set(flags).size!==flags.length)throw new Error('标志仅支持 d g i m s u v y，不能重复')
  const regex=new RegExp(pattern,flags),ast=new RegExpParser({ecmaVersion:2025}).parsePattern(pattern,0,pattern.length,{unicode:flags.includes('u'),unicodeSets:flags.includes('v')})
  const syntax:string[]=[]
  const note=(text:string)=>{if(syntax.length<100)syntax.push(text)}
  visitRegExpAST(ast,{
    onCapturingGroupEnter(node){note(`${node.raw.slice(0,120)} · ${node.name?'命名捕获组 '+node.name:'捕获组'}`)},
    onGroupEnter(node){note(`${node.raw.slice(0,120)} · 非捕获组`)},
    onQuantifierEnter(node){note(`${node.raw.slice(0,120)} · 重复 ${node.min} 至 ${node.max===Infinity?'无限':node.max} 次，${node.greedy?'贪婪':'惰性'}`)},
    onAssertionEnter(node){note(`${node.raw.slice(0,120)} · 断言 ${node.kind}`)},
    onCharacterClassEnter(node){note(`${node.raw.slice(0,120)} · 字符类${node.negate?'（取反）':''}`)},
    onCharacterSetEnter(node){note(`${node.raw.slice(0,120)} · 字符集合 ${node.kind}`)},
    onBackreferenceEnter(node){note(`${node.raw} · 反向引用`)},
  })
  const matches:RegexResult['matches']=[]
  let truncated=false
  while(true){
    const match=regex.exec(input)
    if(!match)break
    if(matches.length===200){truncated=true;break}
    matches.push({index:match.index,end:match.index+match[0].length,text:match[0].slice(0,10000),groups:match.slice(1,13).map(value=>value===undefined?null:value.slice(0,500)),named:Object.fromEntries(Object.entries(match.groups||{}).slice(0,12).map(([key,value])=>[key,value===undefined?null:value.slice(0,500)]))})
    if(!regex.global)break
    if(match[0]===''){
      const index=regex.lastIndex,point=input.codePointAt(index)
      regex.lastIndex=index+((regex.unicode||flags.includes('v'))&&point!==undefined&&point>0xffff?2:1)
    }
  }
  return{matches,syntax,truncated,source:regex.source,flags:regex.flags}
}
