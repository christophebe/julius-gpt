import test from 'ava'
import { PostOutlineValidationError, extractPostOutlineFromCodeBlock, extractCodeBlock } from '../src/lib/extractor'
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

test('extract code block', t => {
  const text = '```markdownThis is markdown text```'
  const result = extractCodeBlock(text)
  t.is(result, 'This is markdown text')

  const text2 = '```This is markdown text```'
  const result2 = extractCodeBlock(text2)
  t.is(result2, 'This is markdown text')

  const text3 = '```html<p>This is html text</p>```'
  const result3 = extractCodeBlock(text3)
  t.is(result3, '<p>This is html text</p>')

  const text4 = '```json{"title": "This is json text"}```'
  const result4 = extractCodeBlock(text4)
  t.is(result4, '{"title": "This is json text"}')
})

function extractInvalidOutline () {
  const content = readTextFileSync('./tests/data/invalid-outline.txt')
  return extractPostOutlineFromCodeBlock(content)
}

function readTextFileSync (file) {
  return fs.readFileSync(file, 'utf8')
}
