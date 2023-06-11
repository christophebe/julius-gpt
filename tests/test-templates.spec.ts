import test from 'ava'
import { extractPrompts, replacePrompt } from '../src/lib/template'
import { readFileSync } from 'fs'

test('Extract prompts', t => {
  const template = readFileSync('./tests/data/template.md', 'utf8')
  const prompts = extractPrompts(template)
  t.not(prompts, null)
  console.log(prompts)
})

test('Replace prompt', t => {
  const template = readFileSync('./tests/data/template.md', 'utf8')
  let newContent = replacePrompt(template, 0, '')
  newContent = replacePrompt(newContent, 1, 'This is the content for the prompt 1')
  newContent = replacePrompt(newContent, 2, 'This is the content for the prompt 2')
  newContent = replacePrompt(newContent, 3, 'This is the content for the prompt 3')
  newContent = replacePrompt(newContent, 4, 'This is the content for the prompt 4')

  t.not(newContent, null)
  console.log(newContent)
})
