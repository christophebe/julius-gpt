import fs from 'fs'
import { Command } from 'commander'
import { askQuestions } from '../question/questions'
import { ChatGptPostGenerator } from '../../post'

export function buildPostCommands (program: Command) {
  program.command('post')
    .description('Generate a post')
    .option('-d, --debug', 'output extra debugging')
    .option('-k, --apiKey <key>', 'set the OpenAI api key')
    .option('-m, --model <model>', 'set the OpenAI model : gpt-4, gpt-3.5-turbo, gpt-3, ...(default : gpt-4)')
    .option('-t, --tokens <token>', 'Number of tokens to generate (default : 8100)')
    .action(async ({ debug, apiKey, model, tokens }) => {
      await generatePost({ debug, apiKey, model, maxModelTokens: tokens })
    })
}

async function generatePost (options) {
  const answers = await askQuestions()

  const postGenerator = new ChatGptPostGenerator(answers, options)
  const post = await postGenerator.generate()
  const writeJSONPromise = fs.promises.writeFile(`${answers.filename}.json`, JSON.stringify(post), 'utf8')
  const writeHTMLPromise = fs.promises.writeFile(`${answers.filename}.html`, post.content, 'utf8')
  await Promise.all([writeJSONPromise, writeHTMLPromise])
  console.log(`🔥 Content is created successfully in ${answers.filename}.json|.html`)
  console.log('- Url : ' + post.url)
  console.log('- SEO Title : ' + post.title)
  console.log('- SEO Description : ' + post.description)
}
