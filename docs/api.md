# 目录 API v1

所有成功响应均为 JSON，目录 ID 采用稳定的短横线 slug。

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

成功 JSON 提供 ETag 与 `Cache-Control: no-cache`，支持 `If-None-Match` 条件请求。错误不缓存。API 不存在时返回 JSON 404，不回退到 SPA 页面；已知路由的不允许方法由 Go ServeMux 返回 405。

当前没有执行接口、账号接口或远程数据持久化。前端 `/tools/:id` 是独立页面，不等同于同名 API 已实现工具运算。
