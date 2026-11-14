# 接入一个新工具

## 只添加目录条目

编辑 `internal/catalog/catalog.json`，在 `tools` 中添加：

```json
{
  "id": "example-tool",
  "categoryId": "development",
  "title": "示例工具",
  "shortDesc": "一句话说明这个工具的用途",
  "icon": "Code2",
  "tags": ["example", "示例"],
  "status": "planned",
  "featured": false,
  "addedAt": "2026-11-14",
  "order": 100
}
```

`id` 是稳定的 URL slug，不能重复；分类必须已存在。前端分类、计数、卡片与命令搜索自动读取目录，不需要另外登记页面。图标名称对应 `web/src/lib/icons.json`；未登记图标会回退为代码图标。目录顺序按 `order` 排列；默认工具排序把编辑精选放在前面。

添加分类时，在同一文件的 `categories` 中登记 `id`、`title`、`description`、`icon`、`tone`、`order`。现有色调包括 `rose`、`violet`、`blue`、`teal`、`orange`、`cyan`、`amber`、`pink`；新色调在 `web/src/styles.css` 中成对定义浅色与深色。

## 接入实际功能

1. 创建 `web/src/features/tools/modules/example-tool.tsx`，默认导出接收 `ToolWorkspaceProps` 的 React 组件。
2. 在 `web/src/features/tools/registry.ts` 的 `loaders` 中添加显式的惰性导入：

```tsx
const loaders: Record<string, Loader> = {
  'example-tool': () => import('./modules/example-tool'),
}
```

3. 功能完成并验证后，把该工具的 `status` 改为 `available`。**只有状态为 available 且模块存在，工作区才会执行模块。**

模块示例接口：

```tsx
import type { ToolWorkspaceProps } from '../registry'

export default function ExampleTool({ tool }: ToolWorkspaceProps) {
  return <section aria-label={tool.title}>{/* 在此放置真实的输入、操作与结果 */}</section>
}
```

不要在模块中重复实现导航、收藏或全局主题。模块拥有自己的输入状态，异常由工具级错误边界隔离。需要服务端处理时，在独立 Go 包实现逻辑，向 `internal/httpapi` 注册 `/api/v1/tools/{id}/…` 接口；不要在目录字段中存放待执行代码。

## 最小验证

修改目录：`go test ./internal/catalog`。修改组件或模块：`npm run build`，再实际打开对应工作区。只有改变公共边界时才增加相关测试，不默认反复运行全站回归。
