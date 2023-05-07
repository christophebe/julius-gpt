import test from 'ava'
import { OpenAIPostGenerator } from '../src/post'
import { PostPrompt } from '../src/types'
import { log } from 'console'

test.only('API with custom template', async t => {
  const postPrompt : PostPrompt = {
    debug: true,
    debugapi: true,
    model: 'gpt-4',
    maxModelTokens: 8000,
    temperature: 0.7,
    frequencyPenalty: 0.5,
    presencePenalty: 0.5,
    logitBias: 0,
    topic: 'Test',
    language: 'en',
    withConclusion: true,
    templateFile: './tests/data/template-2.md'
  }
  const postGenerator = new OpenAIPostGenerator(postPrompt)
  const post = await postGenerator.generate()
  t.not(post, null)
  log(post)
})
