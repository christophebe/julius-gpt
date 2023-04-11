import fs from 'fs'
import { Command } from 'commander'
import { marked } from 'marked'
import { askQuestions } from '../question/questions'
import { OpenAIPostGenerator } from '../../post'
import { PostPrompt } from 'src/types'

type Options = {
  debug: boolean
  debugapi : boolean
  apiKey: string
}

export function buildPostCommands (program: Command) {
  program.command('post')
    .description('Generate a post')
    .option('-d, --debug', 'output extra debugging')
    .option('-da, --debugapi', 'debug the api calls')
    .option('-k, --apiKey <key>', 'set the OpenAI api key')
    .action(async (options) => {
      await generatePost(options)
    })
}

async function generatePost (options: Options) {
  const answers = await askQuestions()
  const postPrompt : PostPrompt = {
    ...options,
    ...answers,
    maxModelTokens: answers.model === 'gpt-4' ? 8000 : 4000

  }

  const postGenerator = new OpenAIPostGenerator(postPrompt)
  const post = await postGenerator.generate()

  const htmlContent = {
    ...post,
    content: marked(post.content)
  }
  const writeJSONPromise = fs.promises.writeFile(`${answers.filename}.json`, JSON.stringify(htmlContent), 'utf8')
  const writeHTMLPromise = fs.promises.writeFile(`${answers.filename}.md`, '# ' + post.title + '\n' + post.content, 'utf8')
  await Promise.all([writeJSONPromise, writeHTMLPromise])

  console.log(`🔥 Content is created successfully in ${answers.filename}.json|.md`)
  console.log('- Slug : ' + post.slug)
  console.log('- SEO Title : ' + post.seoTitle)
  console.log('- SEO Description : ' + post.seoDescription)
  console.log('- Total prompts tokens : ' + post.totalTokens.promptTokens)
  console.log('- Total completion tokens : ' + post.totalTokens.completionTokens)
  console.log('- Total tokens : ' + post.totalTokens.total)
}
