import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getToolModule, isToolAvailable } from './registry.ts'
import type { Catalog } from '../../lib/types.ts'

test('the public catalog contains exactly the requested real workspaces', () => {
  const catalog: Catalog = JSON.parse(
    readFileSync(
      new URL('../../../../internal/catalog/catalog.json', import.meta.url),
      'utf8',
    ),
  )
  const expected = [
    'base64',
    'id-card',
    'color',
    'timestamp',
    'number-base',
    'jwt',
    'word-count',
    'image-base64',
    'http-status',
    'date-diff',
    'timezone',
    'cron',
    'unit',
    'random',
    'password',
    'json',
    'sql-format',
    'image-compress',
    'image-convert',
    'image-resize',
    'dns',
    'ip',
    'user-agent',
    'url-parser',
    'http-client',
    'uuid',
    'regex',
  ]
  assert.deepEqual(
    new Set(catalog.tools.map((tool) => tool.id)),
    new Set(expected),
  )
  for (const tool of catalog.tools) {
    assert.equal(tool.status, 'available')
    assert.ok(isToolAvailable(tool), tool.id)
    assert.ok(getToolModule(tool.id), tool.id)
  }
  for (const category of catalog.categories)
    assert.ok(
      catalog.tools.some((tool) => tool.categoryId === category.id),
      category.id,
    )
})
