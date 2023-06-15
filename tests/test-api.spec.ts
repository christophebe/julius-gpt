import test from 'ava'
import { OpenAIPostGenerator } from '../src/post'
import { PostPrompt } from '../src/types'
import { log } from 'console'

test.skip('API with custom template', async t => {
  const postPrompt : PostPrompt = {
    language: 'english',
    model: 'gpt-4',
    topic: 'Test prompt answer',
    temperature: 0.7,
    frequencyPenalty: 0.5,
    presencePenalty: 0.5,
    logitBias: 0,
    templateFile: './tests/data/template-2.md',
    debug: true,
    debugapi: true
  }
  const postGenerator = new OpenAIPostGenerator(postPrompt)
  const post = await postGenerator.generate()
  t.not(post, null)
  log(post)
})

test('API', async t => {
  try {
    const postPrompt : PostPrompt = {
      language: 'english',
      model: 'gpt-4',
      topic: 'Test prompt answer',
      temperature: 0.7,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
      logitBias: 0,
      debug: false,
      debugapi: false
    }
    const postGenerator = new OpenAIPostGenerator(postPrompt)
    const post = await postGenerator.generate()
    t.not(post, null)
    log(post)
  } catch (e) {
    log(e)
  }
})
