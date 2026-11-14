import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const pkg = 'node_modules/@heroui-pro/react'
if (!existsSync(`${pkg}/dist/index.d.ts`))
  throw new Error(
    'Install your licensed HeroUI Pro package first: npm run setup:pro',
  )
const { version } = JSON.parse(readFileSync(`${pkg}/package.json`, 'utf8'))
mkdirSync('artifacts', { recursive: true })
const output = resolve(`artifacts/heroui-pro-react-${version}.tgz`)
// The package directory contains no credentials. Keep this proprietary build input out of Git.
const result = spawnSync(
  'tar',
  ['-czf', output, '-C', 'node_modules/@heroui-pro', 'react'],
  { stdio: 'inherit' },
)
if (result.error || result.status !== 0) process.exit(1)
console.log(`Private build secret: ${output}`)
