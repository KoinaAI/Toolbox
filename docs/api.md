# API v1

目录及网络接口成功响应为 JSON，图片接口返回二进制图片。目录 ID 采用稳定的短横线 slug。

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/healthz` | `{"status":"ok"}`，不依赖前端构建 |
| GET | `/api/v1/catalog` | `{version, categories, tools}` 完整快照 |
| GET | `/api/v1/categories` | `{items: Category[]}` |
| GET | `/api/v1/tools` | `{items: Tool[], total: number}` |
| GET | `/api/v1/tools/{id}` | 单个工具对象；不存在时返回 404 |

`/api/v1/tools` 支持可选的 `category` 与 `q` 参数。分类必须存在；搜索词最多 128 个 Unicode 字符，空格分隔的词采用 AND 匹配，范围为标题、简介和标签。结果保持目录顺序。前端获取一次完整快照后在浏览器内筛选，并额外允许用分类标题搜索。

错误格式：

```json
{"error":{"code":"tool_not_found","message":"工具不存在"}}
```

目录 JSON 提供 ETag 与 `Cache-Control: no-cache`，支持 `If-None-Match` 条件请求。执行结果与错误使用 `no-store`。API 不回退到 SPA 页面；已知路由的不允许方法由 Go ServeMux 返回 405。

## 网络工具

以下均使用 POST、`Content-Type: application/json`，未知字段会被拒绝，请求 JSON 最大 300 KiB。

| 路径 | 请求 | 响应 |
| --- | --- | --- |
| `/api/v1/tools/dns/query` | `{name, type}`，type 为 A/AAAA/CNAME/MX/NS/TXT/PTR | `{name, type, answers:[{value, preference?}]}` |
| `/api/v1/tools/ip/query` | `{ip}`，IPv4 或 IPv6 | IP 类型、public、地理/网络信息；专用地址只返回本地分类，服务失败明确报错 |
| `/api/v1/tools/http-client/request` | `{url, method, headers:{}, body}`，method 为 GET/POST | `{status,statusText,headers,body,encoding,truncated,durationMs,url}` |

DNS 限时 5 秒。IP 归属信息由固定的 `https://ipwho.is/{ip}` 提供，缓存六小时、最多 256 项；上游失败/配额错误返回 502，不返回虚构数据。

HTTP 不访问非公网 IP、不使用环境代理、不跟随重定向，保留目标 TLS 主机名校验。GET 不接受请求体；POST 体最多 256 KiB。代理/传输类头不能覆盖，请求头最多 50 项。响应限时 12 秒，正文最多 1 MiB，截断时标记 `truncated`；非 UTF-8 正文返回 Base64。目标返回 4xx/5xx 也作为真实响应展示，不能与本站 API 错误混淆。

## 图片工具

POST `/api/v1/tools/{image-compress|image-convert|image-resize}/process`，使用 `multipart/form-data`。

- `file`：恰好一张，最多 12 MiB，按魔数与解码器验证类型。
- `format`：auto/jpeg/png/webp/avif；转换工具选择明确格式。auto 保留支持的原格式，GIF/BMP/TIFF 输出 PNG。
- `quality`：1–100，默认 80；PNG 不使用该选项。
- `width`、`height`：仅缩放工具使用，至少填写一项，范围 1–12000；缺项自动计算。
- `keepAspect`：默认 true，两项都给出时按边界框等比缩放；false 可拉伸。

成功响应为 `image/*`，下载文件名固定，附 `X-Original-Size`、`X-Image-Width`、`X-Image-Height`。拒绝 SVG/视频，处理首帧并移除元数据，JPEG 透明处合成白色。任务限时 25 秒、单实例并发 1、输出最多 25 MiB；图片像素与 AVIF 限制见工具说明。临时目录在结束/失败/取消后清除，Compose 使用限额 tmpfs。

没有账号接口或工具内容持久化。不要把服务器网络工具当作可访问内网的通用代理。
