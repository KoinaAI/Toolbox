# 乱七八糟工具箱

小工具，刚刚好。一个可持续扩展的在线工具目录站，参考站长工具、Base64.us、UU 在线工具的分类与检索方式，采用自己的界面设计。

当前交付 **站点框架**：8 个分类、40 个工具条目；具体转换、计算、生成等工具功能尚未实现，所有工作区明确标记「待接入」。

- 分类浏览、关键词搜索、编辑精选与排序。
- 收藏、最近打开、卡片 / 列表视图，保存在当前浏览器。
- `⌘ / Ctrl K` 命令面板、`/` 聚焦搜索。
- 浅色 / 深色 / 系统主题、移动端分类抽屉。
- 独立工具工作区、惰性模块注册表与错误隔离。
- Go 同源 API 与静态托管、Docker Compose、GHCR 镜像。

## 技术栈

React 19 + TypeScript + Vite（Node.js 构建），HeroUI v3 + HeroUI Pro，Tailwind CSS v4，shadcn/ui 风格的 Radix 控件，Motion、Sonner、Iconify；后端使用 Go 标准库。

实际使用的 Pro 组件包含 Sidebar、Command、Segment、ItemCard 和 EmptyState；基础卡片、输入、下拉菜单、标签、提示、选项卡和折叠面板来自 HeroUI。全站复用语义主题 token，不混用两套颜色系统。

## 开始使用

直接运行发布镜像：

```sh
docker compose up -d
# http://127.0.0.1:8080
```

源码开发需要 Node.js 24+、Go 1.26+ 和自己的 HeroUI Pro 授权：

```sh
npm ci --ignore-scripts
npm run setup:pro
npm run dev:api
# 另开终端
npm run dev
# http://127.0.0.1:5173
```

`setup:pro` 支持已授权的本机安装缓存、包归档或官方 `HEROUI_AUTH_TOKEN`。npm 上的 Pro 引导包不包含完整组件，缺少授权时会明确报错；仓库和成品镜像均不包含密钥。

## 扩展与交付

- [新增分类或工具、接入功能模块](docs/extending.md)
- [API 合约](docs/api.md)
- [容器构建、授权与部署](docs/deployment.md)
- [架构边界](docs/architecture.md)
- [第三方声明](THIRD_PARTY_NOTICES.md)

目录：`internal/catalog/catalog.json`；工具实现注册表：`web/src/features/tools/registry.ts`。新增目录条目后，分类导航、计数、搜索和详情页自动呈现。

## 检查

```sh
npm run build
go test ./internal/catalog ./internal/httpapi
```

按变更运行相应检查即可，不要求每次提交重复执行全站回归。普通 GitHub CI 按路径选择后端检查，完整 Go 验证只在新版本 tag 上运行；授权前端构建另有手动 workflow。
