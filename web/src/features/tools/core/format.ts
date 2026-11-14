import { applyEdits, createScanner, format as jsonFormat, parseTree, printParseErrorCode, SyntaxKind, type ParseError } from 'jsonc-parser'
import { format as sqlFormat, type SqlLanguage } from 'sql-formatter'

/** Validates strict JSON and edits source tokens, preserving large numeric literals. */
export function formatJSON(input: string, indent = 2, minify = false): string {
  if (input.length > 1048576) throw new Error('JSON 输入最多 1 MiB')
  const errors: ParseError[]=[]
  const tree=parseTree(input,errors,{allowTrailingComma:false,disallowComments:true,allowEmptyContent:false})
  if(errors.length){const error=errors[0],prefix=input.slice(0,error.offset),line=prefix.split('\n').length,column=error.offset-prefix.lastIndexOf('\n');throw new Error(`JSON 第 ${line} 行、第 ${column} 列：${printParseErrorCode(error.error)}`)}
  if(!tree)throw new Error('请输入 JSON')
  if(!minify)return applyEdits(input,jsonFormat(input,undefined,{insertSpaces:true,tabSize:indent,eol:'\n'}))
  const scanner=createScanner(input,false)
  let output=''
  for(let token=scanner.scan();token!==SyntaxKind.EOF;token=scanner.scan()){
    if(token!==SyntaxKind.Trivia&&token!==SyntaxKind.LineBreakTrivia)output+=input.slice(scanner.getTokenOffset(),scanner.getTokenOffset()+scanner.getTokenLength())
  }
  return output
}
export function formatSQL(input:string,dialect:SqlLanguage,indent=2):string{
  if(!input.trim())throw new Error('请输入 SQL')
  if(input.length>262144)throw new Error('SQL 输入最多 256 KiB')
  return sqlFormat(input,{language:dialect,tabWidth:indent,keywordCase:'upper',linesBetweenQueries:2})
}
