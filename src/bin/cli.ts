#!/usr/bin/env node
import fs from 'fs'
import * as dotenv from 'dotenv'
import { Command } from 'commander'
import { askQuestions } from './questions'
import { ChatGptPostGenerator } from '../post'
import { init as initStore, getAllWordpress, addWordpress, removeWordpress } from '../lib/store/store'
import pk from '../../package.json' assert { type: 'json' }

dotenv.config()

export async function main () {
  initStore()

  const program = new Command()
  program
    .name('julius')
    .version(pk.version)
    .description('Generate and publish your content from the command line 🤯')

  program.command('post')
    .description('Generate a post')
    .option('-d, --debug', 'output extra debugging')
    .option('-k, --apiKey <key>', 'set the OpenAI api key')
    .option('-m, --model <model>', 'set the OpenAI model : gpt-4, gpt-3.5-turbo, gpt-3, ...(default : gpt-4)')
    .option('-t, --tokens <token>', 'Number of tokens to generate (default : 8100)')
    .action(async ({ debug, apiKey, model, tokens }) => {
      await generatePost({ debug, apiKey, model, maxModelTokens: tokens })
    })

  program
    .command('wp:ls')
    .description('List all Wordpress sites')
    .action(async () => {
      await getAllWp()
    })

  program
    .command('wp:add <domain:username:password>')
    .description('Add new Wordpress site')
    .action(async (site) => {
      await addWpSite(site)
    })

  program
    .command('wp:rm <domain|index>')
    .description('Remove Wordpress site')
    .action(async (domain) => {
      const deleted = await removeWordpress(domain)
      console.log(deleted ? `Wordpress site ${domain} removed successfully` : `Wordpress site ${domain} not found`)
    })

  program.parse()

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
}

async function getAllWp () {
  const wpSites = await getAllWordpress()
  if (wpSites.length === 0) {
    console.log('No Wordpress site found')
    return
  }
  console.log('\nWordpress sites :\n')
  console.log(wpSites.map((wp, index) => `${index + 1}. ${wp.domain} (${wp.username})`).join('\n'))
}

async function addWpSite (site) {
  const [domain, username, password] = site.split(':')
  if (!domain || !username || !password) {
    console.error('Invalid Wordpress site format. Expected : domain:username:password')
    return
  }
  await addWordpress({ domain, username, password })
  console.log(`Wordpress site ${domain} added successfully`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
