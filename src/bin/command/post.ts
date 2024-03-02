import fs from 'fs'
import { Command } from 'commander'
import { marked as markdownToHTML } from 'marked'
import { askQuestions } from '../question/questions'
import { PostGenerator } from '../../post-generator'
import { Post, AutoPostPrompt } from 'src/types'

type Options = {
  interactive: boolean
  debug: boolean
  debugapi: boolean
  apiKey: string
  templateFile: string
  language: string
  model: 'gpt-4-turbo-preview' | 'gpt-4' | 'gpt-3.5-turbo'
  filename: string
  topic: string
  country: string
  generate: boolean // generate the audience and intent
  conclusion: boolean
  temperature: number
  frequencyPenalty: number
  presencePenalty: number
  logitBias: number
}

export function buildPostCommands (program: Command) {
  program.command('post')
    .description('Generate a post in interactive or automatic mode')
    .option('-i, --interactive', 'Use interactive mode (CLI questions)')
    .option('-l, --language <language>', 'Set the language (optional), english by default')
    .option('-m, --model <model>', 'Set the LLM : "gpt-4-turbo-preview" | "gpt-4" | "gpt-3.5-turbo" (optional), gpt-4-turbo-preview by default')
    .option('-f, --filename <filename>', 'Set the post file name (optional)')
    .option('-pf, --promptfolder <promptFolder>', 'Use custom prompt define in this folder (optional)')
    .option('-tp, --topic <topic>', 'Set the post topic (optional)')
    .option('-c, --country <country>', 'Set the country (optional)')
    .option('-g, --generate', 'Generate the audience and intent (optional)')
    .option('-co, --conclusion', 'Generate a conclusion (optional)')
    .option('-tt, --temperature <temperature>', 'Set the temperature (optional)')
    .option('-fp, --frequencypenalty <frequencyPenalty>', 'Set the frequency penalty (optional)')
    .option('-pp, --presencepenalty <presencePenalty>', 'Set the presence penalty (optional)')
    .option('-lb, --logitbias <logitBias>', 'Set the logit bias (optional)')
    .option('-d, --debug', 'Output extra debugging (optional)')
    .option('-da, --debugapi', 'Debug the api calls (optional)')
    .option('-k, --apiKey <key>', 'Set the OpenAI api key (optional, you can also set the OPENAI_API_KEY environment variable)')
    .action(async (options) => {
      try {
        await generatePost(options)
      } catch (error) {
        console.error(`Error during the generation of the post : ${error}`)
      }
    })
}

async function generatePost (options: Options) {
  let answers : any = {}
  if (isInteractive(options)) {
    answers = await askQuestions()
  }

  const defaultPostPrompt = buildDefaultPostPrompt()

  const postPrompt : AutoPostPrompt = {
    ...defaultPostPrompt,
    ...options,
    ...answers
  }

  if (!postPrompt.topic) {
    throw new Error('The topic is mandatory, use the option -tp or --topic')
  }

  const postGenerator = new PostGenerator(postPrompt)
  const post = await postGenerator.generate()

  const jsonData = {
    ...post,
    content: markdownToHTML(post.content)
  }

  const jsonFile = `${postPrompt.filename}.json`
  const contentFile = `${postPrompt.filename}.md`

  const writeJSONPromise = fs.promises.writeFile(jsonFile, JSON.stringify(jsonData), 'utf8')
  const writeDocPromise = fs.promises.writeFile(contentFile, buildMDPage(post), 'utf8')
  await Promise.all([writeJSONPromise, writeDocPromise])

  console.log(`🔥 Content is successfully generated in the file : ${contentFile}. Use the file ${jsonFile} to publish the content on Wordpress.`)
  console.log(`- Slug : ${post.slug}`)
  console.log(`- H1 : ${post.h1}`)
  console.log(`- SEO Title : ${post.seoTitle}`)
  console.log(`- SEO Description : ${post.seoDescription}`)
}

function isInteractive (options : Options) {
  return options?.interactive
}

function buildDefaultPostPrompt () : AutoPostPrompt {
  return {
    model: 'gpt-4-turbo-preview',
    language: 'english',
    withConclusion: true,
    temperature: 0.8,
    frequencyPenalty: 1,
    presencePenalty: 1,
    logitBias: 0
  }
}

function buildMDPage (post: Post) {
  return '# ' + post.h1 + '\n' + post.content
}
