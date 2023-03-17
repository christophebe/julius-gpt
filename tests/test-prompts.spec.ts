import test from 'ava'
import { getPromptForOutline } from '../src/lib/prompts'

test('Generate prompt', t => {
  const postPrompt = {
    title: 'test',
    withConclusion: true,
    country: 'France',
    intent: 'this is a test',
    audience: 'young people',
    topic: 'this is a test',
    language: 'fr',
    optionalh3: true

  }
  const prompt = getPromptForOutline(postPrompt)
  t.not(prompt, null)
  t.not(prompt, '')
  // console.log(prompt)
})
