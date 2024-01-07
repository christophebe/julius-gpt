import { PostPrompt } from '../src/types'
import { PostGenerator } from '../src/post-generator'
import { log } from 'console'

describe('API with custom template', () => {
  it.skip('generates a post', async () => {
    const postPrompt: PostPrompt = {
      language: 'english',
      model: 'gpt-4',
      topic: 'Test prompt answer',
      temperature: 0.7,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
      logitBias: 0,
      templateFile: './tests/data/template-2.md',
      debug: true,
      debugapi: true,
      templateFolder: './templates'
    }
    const postGenerator = new PostGenerator(postPrompt)
    const post = await postGenerator.generate()
    expect(post).not.toBeNull()
    log(post)
  })
})

describe('API', () => {
  it('generates a post', async () => {
    try {
      const postPrompt: PostPrompt = {
        language: 'english',
        model: 'gpt-4-1106-preview',
        topic: 'How to become a digital nomad ?',
        templateFolder: './templates'
        // temperature: 0.7,
        // frequencyPenalty: 0.5,
        // presencePenalty: 0.5,
        // logitBias: 0,
        // debug: false,
        // debugapi: false
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
