import { existsSync, readFileSync, cpSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { spawnSync } from 'node:child_process'

const packageDir = resolve('node_modules/@heroui-pro/react')
const expected = JSON.parse(readFileSync('web/package.json', 'utf8'))
  .dependencies['@heroui-pro/react']
const ready = () =>
  existsSync(join(packageDir, 'dist/components/sidebar/index.js')) &&
  existsSync(join(packageDir, 'dist/index.d.ts'))
const checkVersion = () => {
  const actual = JSON.parse(
    readFileSync(join(packageDir, 'package.json'), 'utf8'),
  ).version
  if (actual !== expected)
    throw new Error(
      `HeroUI Pro version mismatch: expected ${expected}, got ${actual}`,
    )
}
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.error || result.status !== 0)
    throw new Error(`${command} failed; check your licensed package or token`)
}

try {
  const archive =
    process.env.HEROUI_PRO_ARCHIVE ||
    (existsSync('/run/secrets/heroui_pro_package')
      ? '/run/secrets/heroui_pro_package'
      : '')
  const tokenFile =
    process.env.HEROUI_AUTH_TOKEN_FILE ||
    (existsSync('/run/secrets/heroui_auth_token')
      ? '/run/secrets/heroui_auth_token'
      : '')
  const token = tokenFile
    ? readFileSync(tokenFile, 'utf8').trim()
    : process.env.HEROUI_AUTH_TOKEN
  if (archive) {
    mkdirSync(packageDir, { recursive: true })
    run('tar', [
      '-xzf',
      resolve(archive),
      '--strip-components=1',
      '-C',
      packageDir,
    ])
    console.log('Loaded the supplied licensed HeroUI Pro archive.')
  } else if (token) {
    run(process.execPath, [join(packageDir, 'dist/postinstall/index.js')], {
      env: { ...process.env, HEROUI_AUTH_TOKEN: token },
    })
  } else if (!ready()) {
    const cache = join(homedir(), '.heroui/cache/react', expected)
    if (existsSync(join(cache, 'dist/index.d.ts'))) {
      cpSync(cache, packageDir, { recursive: true })
      console.log(
        'Reused the existing version-matched local HeroUI Pro installation.',
      )
    } else {
      throw new Error(
        'HeroUI Pro is not installed. Run `npx heroui-pro login` and `npx heroui-pro install`, or supply HEROUI_AUTH_TOKEN / HEROUI_PRO_ARCHIVE. See docs/deployment.md. No unlicensed substitute is used.',
      )
    }
  }
  if (!ready())
    throw new Error(
      'The Pro installer did not provide component sources. Check your license.',
    )
  checkVersion()
  console.log(`HeroUI Pro ${expected} is ready.`)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
