import { AutoPostPrompt, TemplatePostPrompt } from '../src/types'
import { PostGenerator, PostTemplateGenerator } from '../src/post-generator'
import { log } from 'console'

describe('API', () => {
  it.skip('generates a post in automatic mode', async () => {
    try {
      const postPrompt: AutoPostPrompt = {
        language: 'french',
        model: 'gpt-4-turbo-preview',
        topic: 'Comment devenir digital nomad ?',
        promptFolder: './prompts'
      }
      const postGenerator = new PostGenerator(postPrompt)
      const post = await postGenerator.generate()
      expect(post).not.toBeNull()
      log(post)
    } catch (e) {
      log(e)
    }
  }, 300000)
})

describe('API with a custom template', () => {
  it.skip('generates a post', async () => {
    const postPrompt: TemplatePostPrompt = {
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
      logitBias: 0,
      templateFile: './tests/data/template-2.md',
      promptFolder: './prompts',
      debug: true,
      debugapi: true,
      input: {}
    }
    const postGenerator = new PostTemplateGenerator(postPrompt)
    const post = await postGenerator.generate()
    expect(post).not.toBeNull()
    log(post)
  }, 300000)
})
