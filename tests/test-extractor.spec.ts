import test from 'ava'
import { PostOutlineValidationError, extractPostOutlineFromCodeBlock } from '../src/lib/extractor'
import fs from 'fs'
import { PostOutline } from '../src/types'

test.skip('extract outline', t => {
  const content = readTextFileSync('./tests/data/outline-test.txt')
  const result : PostOutline = extractPostOutlineFromCodeBlock(content)
  t.not(result.title, null)
  t.not(result.title, '')
})

test.skip('Invalid outline', t => {
  t.throws(() => extractInvalidOutline(), { instanceOf: PostOutlineValidationError })
})

function extractInvalidOutline () {
  const content = readTextFileSync('./tests/data/invalid-outline.txt')
  return extractPostOutlineFromCodeBlock(content)
}

function readTextFileSync (file) {
  return fs.readFileSync(file, 'utf8')
}
