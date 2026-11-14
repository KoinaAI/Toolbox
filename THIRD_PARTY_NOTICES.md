# Third-party notices

- HeroUI (`@heroui/react`, `@heroui/styles`): MIT. See the installed packages for their license notices.
- HeroUI Pro (`@heroui-pro/react`): commercial license. This repository does not redistribute its component source or credentials. Build with your own licensed installation.
- The Radix toggle-group adapter follows shadcn/ui's MIT-licensed composition pattern. Copyright (c) 2023 shadcn. See https://github.com/shadcn-ui/ui/blob/main/LICENSE.md.
- The selected Iconify icon data in `web/src/lib/icons.json` comes from Gravity UI Icons (MIT), distributed through `@iconify-json/gravity-ui`. See https://github.com/gravity-ui/icons/blob/main/LICENSE.
- Geist font: SIL Open Font License 1.1, distributed through `@fontsource-variable/geist`.

Other dependencies retain their respective licenses. Dependency versions and provenance are recorded in package-lock.json.

## Utility runtime dependencies

Full copied license texts and exact versions are retained under `web/public/licenses/tools/` and shipped as static assets. This covers scure-base (MIT), Temporal polyfill (ISC), Culori (MIT), cron-parser (MIT), cRonstrue (MIT), Monaco Editor (MIT), sql-formatter (MIT), jsonc-parser (MIT), uuid (MIT), Vant area data (MIT), Bowser (MIT), regexpp (MIT) and their runtime dependencies. `manifest.json` records package versions and upstream repositories.

HTTP status names are sourced from the IANA HTTP Status Code Registry; the data file records its source URL and retrieval date. Administrative region names may not include historical boundaries.

The container also distributes Alpine's FFmpeg and supporting libraries under their upstream licenses. The pinned Alpine package version is recorded in Dockerfile; corresponding package recipes/source references are available from https://git.alpinelinux.org/aports/tree/community/ffmpeg?h=3.24-stable and the upstream FFmpeg project https://ffmpeg.org/. HeroUI Pro remains a licensed build input and is not copied as component source.
