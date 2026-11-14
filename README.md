# 乱七八糟工具箱

一个把日常琐事整理得井井有条的在线工具站。React / Node.js 前端构建，Go 后端提供目录 API，元数据与工具实现分离。

当前阶段交付站点框架：分类、搜索、收藏、最近使用、命令面板、主题切换和工具详情工作区。目录中的具体计算、转换功能暂未实现，工具页会明确标记为「待接入」。

## 项目结构

- `internal/catalog`：分类、工具定义与可替换目录源。
- `internal/httpapi`：版本化 HTTP API、健康检查和前端静态托管。
- `cmd/toolbox`：配置与服务生命周期。
- `web`：Vite + React + TypeScript；HeroUI / HeroUI Pro、Tailwind CSS v4、shadcn/ui、Motion。
- `docs`：扩展说明与 API 合约。

## 开发与部署

开发启动、Docker Compose 与 GHCR 交付说明随相应功能提交更新。
