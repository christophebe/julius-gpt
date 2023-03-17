import test from 'ava'
import { extractPostOutlineFromCodeBlock } from '../src/lib/extractor'
import fs from 'fs'
import { PostOutline, PostOutlineValidationError } from '../src/types'

test('extract outline', t => {
  const content = readTextFileSync('./tests/data/outline-test.txt')
  const result : PostOutline = extractPostOutlineFromCodeBlock(content)
  t.not(result.title, null)
  t.not(result.title, '')
})

test('Invalid outline', t => {
  t.throws(() => extractInvalidOutline(), { instanceOf: PostOutlineValidationError })
})

function extractInvalidOutline () {
  const content = readTextFileSync('./tests/data/invalid-outline.txt')
  return extractPostOutlineFromCodeBlock(content)
}

function readTextFileSync (file) {
  return fs.readFileSync(file, 'utf8')
}
