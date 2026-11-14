# 乱七八糟工具箱

小工具，刚刚好。一个可持续扩展的在线工具目录站，参考站长工具、Base64.us、UU 在线工具的分类与检索方式，采用自己的界面设计。

提供 **8 个分类、27 个真实工具工作区**，未实现的占位工具已移除。包括多种 Base 编码、身份证规则校验、颜色与日期时间转换、文本统计、安全随机生成、正则测试、Monaco JSON/SQL 格式化、网络查询及 FFmpeg 图片处理。

- 分类浏览、关键词搜索、编辑精选与排序。
- 收藏、最近打开、卡片 / 列表视图，保存在当前浏览器。
- `⌘ / Ctrl K` 命令面板。
- 浅色 / 深色 / 系统主题、移动端分类抽屉。
- 独立工具工作区、惰性模块注册表与错误隔离。
- Go 同源 API 与静态托管、Docker Compose、GHCR 镜像。

## 技术栈

React 19 + TypeScript + Vite（Node.js 构建），HeroUI v3 + HeroUI Pro，Tailwind CSS v4，shadcn/ui 风格的 Radix 控件，Motion、Sonner、Iconify；后端使用 Go 标准库。

实际使用的 Pro 组件包含 Sidebar、Command、Segment、ItemCard 和 EmptyState；选择框、日历、基础表单、开关、按钮、卡片与提示来自 HeroUI。Monaco 及其 Worker 由本站打包加载，不依赖 CDN；正则与格式化在可终止的独立 Worker 内执行。

## 开始使用

直接运行发布镜像：

```sh
docker compose up -d
# http://127.0.0.1:8080
```

源码开发需要 Node.js 24+、Go 1.26+ 和自己的 HeroUI Pro 授权。图片处理需要 `ffmpeg` / `ffprobe`，并包含 `mjpeg`、`png`、`libwebp`、`libaom-av1` 编码器；Docker 镜像自带这些依赖。

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
- [工具行为与处理限制](docs/tools.md)

目录：`internal/catalog/catalog.json`；工具实现注册表：`web/src/features/tools/registry.ts`。先实现并注册模块，再加入目录；目录验证不接受计划中条目，前端合约测试会检查条目与实现一致。

## 检查

```sh
npm run build
node --experimental-strip-types --test web/src/features/tools/core/encoding.test.ts
go test ./internal/imaging
```

按变更选择相关检查，不要求每次提交重复全站回归。普通 CI 按路径检查后端或工具算法；新版本 tag 执行完整 Go 和工具合约验证。授权前端构建另有手动 workflow；没有 Pro 凭据不会假装执行完整前端构建。
