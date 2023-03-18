#!/usr/bin/env node
import * as dotenv from 'dotenv'
import { Command } from 'commander'
import { askQuestions } from './questions'
import { ChatGptPostGenerator } from '../post'
import fs from 'fs'
import pk from '../../package.json' assert { type: 'json' }

dotenv.config()

export async function main () {
  const program = new Command()
  program
    .name('julius')
    .version(pk.version)
    .description('Generate and publish your content from the command line 🤯')
  program.option('-d, --debug', 'output extra debugging')
  program.option('-k, --apiKey <key>', 'set the OpenAI api key')
  program.parse(process.argv)

  const { debug, apiKey } = program.opts()

  const answers = await askQuestions()

  const postGenerator = new ChatGptPostGenerator(answers, { debug, apiKey })
  const post = await postGenerator.generate()

  fs.writeFileSync(answers.filename, post.content, 'utf8')
  console.log('🔥 Content is created successfully in : ' + answers.filename)
  console.log('- SEO Title : ' + post.title)
  console.log('- SEO Description : ' + post.description)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
