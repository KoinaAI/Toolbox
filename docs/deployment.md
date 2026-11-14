# 运行与构建

## 直接运行镜像

```sh
docker compose up -d
```

默认访问 `http://127.0.0.1:8080`。Compose 使用 `ghcr.io/koinaai/toolbox:0.2.1`，可通过 `.env` 的 `TOOLBOX_IMAGE` 改为提交标签或不可变 digest。默认仅绑定本机；需要对外开放时显式设置 `TOOLBOX_BIND=0.0.0.0`，并在前置网关配置 TLS。

首次发布的 GHCR 包可能保持私有。若拉取提示未授权，先使用有该包读取权限的账号登录 `docker login ghcr.io`。镜像运行无需 Node.js、HeroUI 凭据、数据库或挂载目录；个人收藏只在浏览器保存。

```sh
docker compose ps
docker compose logs --tail=30
docker compose down
```

## 本地开发

需要 Node.js 24+、Go 1.26.0+。图片功能还需要 `ffmpeg` 与 `ffprobe`，FFmpeg 必须包含 mjpeg、png、libwebp、libaom-av1 编码器；部分 Homebrew 精简安装不包含后两项，推荐使用自带完整编解码器的 Docker 镜像。

```sh
npm ci --ignore-scripts
npm run setup:pro
npm run dev:api
# 另一个终端
npm run dev
```

访问 `http://127.0.0.1:5173`，Vite 将 `/api` 代理到 `127.0.0.1:8080`；可通过 `API_PROXY_TARGET` 修改代理目标。构建与生产启动：

```sh
npm run build
go run ./cmd/toolbox
```

## HeroUI Pro 授权

本仓库只包含应用代码，不分发 Pro 组件源码或安装密钥。`npm ci --ignore-scripts` 会安装 npm 上的引导包，**不能代替商业授权安装**。`npm run setup:pro` 按以下顺序支持：

1. `HEROUI_PRO_ARCHIVE`：自己已授权安装的、版本匹配的包归档。
2. `HEROUI_AUTH_TOKEN` 或 `HEROUI_AUTH_TOKEN_FILE`：HeroUI 官方 CI/CD token。
3. 已安装的组件或本机 `~/.heroui/cache/react/<version>` 缓存。

也可以先运行官方的 `npx heroui-pro login`、`npx heroui-pro install` 完成授权，然后再构建。当前锁定 `@heroui-pro/react@1.0.0-beta.11`，不要用不同版本的归档替代。

## 从源码构建容器

复用自己的已授权本地安装：

```sh
npm run setup:pro
npm run archive:pro
export HEROUI_PRO_ARCHIVE="$PWD/artifacts/heroui-pro-react-1.0.0-beta.11.tgz"
docker compose -f compose.yaml -f compose.build.yaml up -d --build
```

归档是构建 secret，位于 Git 忽略的 `artifacts` 目录；不要上传或提交。Pro 源码只用于构建阶段。最终镜像使用固定 digest 的 Alpine 3.24，包含固定版本 FFmpeg、Go 二进制、CA 证书与编译页面，不包含 Node.js 或构建凭据。

直接使用官方 token：

```sh
docker build --secret id=heroui_auth_token,env=HEROUI_AUTH_TOKEN \
  --build-arg VCS_REF="$(git rev-parse HEAD)" -t toolbox:local .
```

两个平台使用同一个前端构建：`docker buildx build --platform linux/amd64,linux/arm64 ...`。需要自己提供相应 Buildx 驱动和 registry 登录。

## 配置

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `LISTEN_ADDR` | `:8080` | Go 监听地址 |
| `STATIC_DIR` | 本地 `web/dist`，镜像 `/app/web` | 静态目录，符号链接不能越出根目录 |
| `HEALTHCHECK_URL` | `http://127.0.0.1:8080/healthz` | 自定义端口时供 `-healthcheck` 使用 |

容器以 UID/GID 65532 运行，Compose 启用只读根文件系统、移除全部 capability，并禁用权限提升。`/tmp` 为 256 MiB 的 tmpfs，容器内存限制 1 GiB、进程上限 128；可按实际容量调整。图片处理依赖该可写临时目录，不需要持久化卷。镜像自带健康检查，SIGTERM 最多等待 10 秒退出。

网络工具需要服务器出站 DNS/HTTP/HTTPS。出站 HTTP 不使用代理环境变量，并拒绝专用/保留地址；如果开发机 DNS 使用 Fake-IP，需让服务运行环境使用返回真实公网 IP 的 DNS，不能以关闭 SSRF 防护替代。

## CI 与后续发布

普通 CI 按修改路径执行 Go 目录/API 检查；新版本 tag 才运行全部 Go 测试与 vet。没有提供 Pro 凭据时，不假装执行前端构建。前端可使用独立的 `Licensed Web Build` workflow，在仓库设置 `HEROUI_AUTH_TOKEN` 后手动触发；该 workflow 会明确拒绝缺少授权的构建。

初次镜像由本地已授权构建提供并实际拉取验证。后续发布时，先确认相同提交的版本验证通过，再从该提交构建、启动验证并推送镜像。使用 `ghcr.io/koinaai/toolbox:<version>` 与 `sha-<full-commit>` 标签，记录 digest。版本与 SHA 标签保持不可变；已存在时不要覆盖，修复后发布新版本。本仓库不会在普通 push、PR 或无授权的环境中擅自发布镜像。
