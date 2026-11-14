import {useEffect,useState} from 'react'
import {Button} from '@heroui/react'
import {base64,base64nopad} from '@scure/base'
import {Field,KeyValues,Notice,useOperation} from '../shared'

export default function Base64Image(){
  const [input,setInput]=useState(''),[result,setResult]=useState<{url:string;type:string;extension:string;size:number;width:number;height:number}|null>(null)
  const op=useOperation()
  useEffect(()=>()=>{if(result)URL.revokeObjectURL(result.url)},[result])
  return <div className="utility-stack"><Field label="Base64 或图片 Data URL" value={input} onChange={setInput} multiline maxLength={18000000}/><div className="utility-actions"><Button isPending={op.busy} onPress={()=>op.run(async()=>{
    let text=input.trim(),declared=''
    if(text.startsWith('data:')){const match=/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]*)$/.exec(text);if(!match)throw new Error('Data URL 必须为 data:image/类型;base64,编码');declared=match[1].toLowerCase();text=match[2]}
    text=text.replace(/\s/g,'');if(!text||text.length>17000000)throw new Error('请输入不超过 12 MiB 的图片编码')
    const bytes=(text.includes('=')?base64:base64nopad).decode(text)
    if(bytes.length>12*1024*1024)throw new Error('图片最多 12 MiB')
    const first=(...values:number[])=>values.every((value,i)=>bytes[i]===value)
    let type='',extension=''
    if(first(137,80,78,71,13,10,26,10)){type='image/png';extension='png'}else if(first(255,216,255)){type='image/jpeg';extension='jpg'}else if(new TextDecoder().decode(bytes.slice(0,6)).match(/^GIF8[79]a$/)){type='image/gif';extension='gif'}else if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'){type='image/webp';extension='webp'}else if(first(66,77)){type='image/bmp';extension='bmp'}else throw new Error('支持 PNG、JPEG、GIF、WebP、BMP；不接受 SVG 或 HTML')
    if(declared&&declared!==type&&!(declared==='image/jpg'&&type==='image/jpeg'))throw new Error('Data URL 声明类型与图片内容不符')
    const blob=new Blob([new Uint8Array(bytes).buffer],{type}),bitmap=await createImageBitmap(blob)
    const {width,height}=bitmap;bitmap.close();if(width*height>24000000)throw new Error('图片最多 2400 万像素')
    setResult({url:URL.createObjectURL(blob),type,extension,size:bytes.length,width,height})
  })}>转换并预览</Button><Button variant="ghost" onPress={()=>{setInput('');setResult(null);op.setError('')}}>清空</Button></div><Notice error>{op.error}</Notice>{result&&<><img className="utility-image" src={result.url} alt="解码后的图片"/><KeyValues values={[["格式",result.type],["尺寸",`${result.width} × ${result.height}`],["大小",`${result.size.toLocaleString()} 字节`]]}/><a className="primary-link w-fit" href={result.url} download={`decoded-image.${result.extension}`}>下载图片</a></>}<Notice>编码只在浏览器内解码，不上传。为避免可执行内容与外部资源请求，不预览 SVG；GIF 下载保留原始动画数据。</Notice></div>
}
