import fs from 'fs'
import { Command } from 'commander'
import { marked } from 'marked'
import { askCustomQuestions, askQuestions } from '../question/questions'
import { OpenAIPostGenerator } from '../../post'
import { Post, PostPrompt } from 'src/types'
import { NoApiKeyError } from 'src/lib/errors'

const GPT4_PROMPT_PRICE = 0.03
const GPT4_COMPLETION_PRICE = 0.06
const GPT35_PROMPT_PRICE = 0.002
const GPT_COMPLETION_PRICE = 0.002

type Options = {
  interactive: boolean
  debug: boolean
  debugapi: boolean
  apiKey: string
  templateFile: string
  language: string
  model: string
  filename: string
  topic: string
  country: string
  generate: boolean // generate the audience and intent
  conclusion: boolean
  tone: string
  temperature: number
  frequencyPenalty: number
  presencePenalty: number
  logitBias: number
}

export function buildPostCommands (program: Command) {
  program.command('post')
    .description('Generate a post')
    .option('-t, --templateFile <file>', 'Set the template file (optional)')
    .option('-i, --interactive', 'Use interactive mode (CLI questions)')
    .option('-l, --language <language>', 'Set the language (optional), english by default')
    .option('-m, --model <model>', 'Set the LLM : "gpt-4" | "gpt-4-32k" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" (optional), GPT-4 by default')
    .option('-f, --filename <filename>', 'Set the post file name (optional)')
    .option('-tp, --topic <topic>', 'Set the post topic (optional)')
    .option('-c, --country <country>', 'Set the country (optional)')
    .option('-g, --generate', 'Generate the audience and intent (optional)')
    .option('-co, --conclusion', 'With conclusion (optional)')
    .option('-to, --tone <tone>', 'Set the tone : "informative" | "captivating" (optional)')
    .option('-tp, --temperature <temperature>', 'Set the temperature (optional)')
    .option('-fp, --frequencypenalty <frequencyPenalty>', 'Set the frequency penalty (optional)')
    .option('-pp, --presencepenalty <presencePenalty>', 'Set the presence penalty (optional)')
    .option('-lb, --logitbias <logitBias>', 'Set the logit bias (optional)')
    .option('-d, --debug', 'Output extra debugging')
    .option('-da, --debugapi', 'Debug the api calls')
    .option('-k, --apiKey <key>', 'Set the OpenAI api key (optional, you can also set the OPENAI_API_KEY environment variable)')
    .action(async (options) => {
      try {
        await generatePost(options)
      } catch (error) {
        if (error instanceof NoApiKeyError) {
          console.error('Unable to initialize the ChatGPT API. Please make sure that you have set the OPENAI_API_KEY environment variable or use the -K option for setting the API key')
        } else {
          console.error(`Error during the generation of the post : ${error}`)
        }
      }
    })
}

async function generatePost (options: Options) {
  let answers : any = {}
  if (isInteractive(options)) {
    answers = isCustom(options) ? await askCustomQuestions() : await askQuestions()
  }

  const defaultPostPrompt = buildDefaultPostPrompt()

  const postPrompt : PostPrompt = {
    ...defaultPostPrompt,
    ...options,
    ...answers,
    maxModelTokens: answers.model === 'gpt-4' ? 8000 : 4000

  }

  if (!postPrompt.topic) {
    throw new Error('The topic is mandatory, use the option -tp or --topic')
  }

  const postGenerator = new OpenAIPostGenerator(postPrompt)
  const post = await postGenerator.generate()

  const jsonData = {
    ...post,
    content: isCustom(options)
      ? (isMarkdown(options)
          ? marked(post.content)
          : post.content)
      : marked(post.content)
  }

  const jsonFile = `${postPrompt.filename}.json`
  const contentFile = `${postPrompt.filename}.${getFileExtension(options)}`

  const writeJSONPromise = fs.promises.writeFile(jsonFile, JSON.stringify(jsonData), 'utf8')
  const writeDocPromise = fs.promises.writeFile(contentFile, buildContent(options, post), 'utf8')
  await Promise.all([writeJSONPromise, writeDocPromise])

  console.log(`🔥 Content is successfully generated in the file : ${contentFile}. Use the file ${jsonFile} to publish the content on Wordpress.`)
  console.log(`- Slug : ${post.slug}`)
  console.log(`- H1 : ${post.title}`)
  console.log(`- SEO Title : ${post.seoTitle}`)
  console.log(`- SEO Description : ${post.seoDescription}`)
  console.log(`- Total prompts tokens : ${post.totalTokens.promptTokens}`)
  console.log(`- Total completion tokens : ${post.totalTokens.completionTokens}`)
  console.log(`- Estimated cost :  ${estimatedCost(postPrompt.model, post)}$`)
}

function isInteractive (options : Options) {
  return options?.interactive
}

function isCustom (options : Options) {
  return options.templateFile !== undefined
}

function buildDefaultPostPrompt () : PostPrompt {
  return {
    model: 'gpt-4',
    language: 'english',
    tone: 'informative',
    withConclusion: true,
    temperature: 0.8,
    frequencyPenalty: 0,
    presencePenalty: 1,
    logitBias: 0
  }
}

function buildContent (options : Options, post : Post) {
  return isHTML(options)
    ? buildHTMLPage(post)
    // in automatic mode, we add the title (h1) into the content
    : buildMDPage(post)
}

function isHTML (options : Options) {
  return getFileExtension(options) === 'html'
}

function isMarkdown (options : Options) {
  return getFileExtension(options) === 'md'
}

function getFileExtension (options : Options) {
  // in custom mode, we use the template extension
  // in auto/default mode, we use the markdown extension in all cases
  return isCustom(options) ? options.templateFile.split('.').pop() : 'md'
}

function buildMDPage (post: Post) {
  return '# ' + post.title + '\n' + post.content
}

function buildHTMLPage (post : Post) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${post.seoTitle}</title>
    <meta name="description" content="${post.seoDescription}">
  </head>
  <body>
    <h1>${post.title}</h1>
    ${post.content}
  </body>
  </html>
  `
}

function estimatedCost (model : string, post : Post) {
  const promptTokens = post.totalTokens.promptTokens
  const completionTokens = post.totalTokens.completionTokens

  return (model === 'gpt-4')
    ? Number(((promptTokens / 1000) * GPT4_PROMPT_PRICE) + ((completionTokens / 1000) * GPT4_COMPLETION_PRICE)).toFixed(4)
    : Number(((promptTokens / 1000) * GPT35_PROMPT_PRICE) + ((completionTokens / 1000) * GPT_COMPLETION_PRICE)).toFixed(4)
}
