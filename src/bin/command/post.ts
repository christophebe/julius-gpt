import fs from 'fs'
import { Command } from 'commander'
import { askQuestions } from '../question/questions'
import { OpenAIPostGenerator } from '../../post'
import { PostPrompt } from 'src/types'
import { type } from 'os'

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

  const writeJSONPromise = fs.promises.writeFile(`${answers.filename}.json`, JSON.stringify(post), 'utf8')
  const writeHTMLPromise = fs.promises.writeFile(`${answers.filename}.html`, post.content, 'utf8')
  await Promise.all([writeJSONPromise, writeHTMLPromise])

  console.log(`🔥 Content is created successfully in ${answers.filename}.json|.html`)
  console.log('- Slug : ' + post.slug)
  console.log('- SEO Title : ' + post.seoTitle)
  console.log('- SEO Description : ' + post.seoDescription)
}
