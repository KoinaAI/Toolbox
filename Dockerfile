# syntax=docker/dockerfile:1.7
FROM --platform=$BUILDPLATFORM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS frontend
WORKDIR /src
COPY package.json package-lock.json ./
COPY web/package.json web/package.json
# Scripts are disabled until the licensed Pro input is mounted explicitly.
RUN npm ci --ignore-scripts --no-fund --no-audit
COPY scripts/setup-pro.mjs scripts/setup-pro.mjs
RUN --mount=type=secret,id=heroui_pro_package --mount=type=secret,id=heroui_auth_token node scripts/setup-pro.mjs
COPY web web
RUN npm run build

FROM --platform=$BUILDPLATFORM golang:1.26.7-alpine@sha256:28d89ee9cc0ff9fec75c82ca201e6bf7fdf9a679d4b7b24dfa04f2bb766bb468 AS backend
WORKDIR /src
COPY go.mod ./
COPY cmd cmd
COPY internal internal
ARG TARGETOS=linux
ARG TARGETARCH
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -trimpath -ldflags='-s -w' -o /toolbox ./cmd/toolbox

FROM scratch AS runtime
ARG VCS_REF=unknown
LABEL org.opencontainers.image.title="Toolbox" \
      org.opencontainers.image.description="An extensible tool directory with a React frontend and Go API" \
      org.opencontainers.image.source="https://github.com/KoinaAI/Toolbox" \
      org.opencontainers.image.revision="${VCS_REF}"
COPY --from=backend /toolbox /toolbox
COPY --from=backend /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=frontend /src/web/dist /app/web
ENV LISTEN_ADDR=:8080 STATIC_DIR=/app/web
USER 65532:65532
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=4s --start-period=5s --retries=3 CMD ["/toolbox", "-healthcheck"]
ENTRYPOINT ["/toolbox"]
