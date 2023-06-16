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
  debug: boolean
  debugapi : boolean
  apiKey: string
  templateFile: string
}

export function buildPostCommands (program: Command) {
  program.command('post')
    .description('Generate a post')
    .option('-t, --templateFile <file>', 'set the template file (optional)')
    .option('-d, --debug', 'output extra debugging')
    .option('-da, --debugapi', 'debug the api calls')
    .option('-k, --apiKey <key>', 'set the OpenAI api key (optional, you can also set the OPENAI_API_KEY environment variable)')
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
  const isCustomMode = isCustom(options)
  const answers = isCustomMode ? await askCustomQuestions() : await askQuestions()
  const postPrompt : PostPrompt = {
    ...options,
    ...answers,
    maxModelTokens: answers.model === 'gpt-4' ? 8000 : 4000

  }

  const postGenerator = new OpenAIPostGenerator(postPrompt)
  const post = await postGenerator.generate()

  const jsonData = {
    ...post,
    content: isCustomMode
      ? (isMarkdown(options)
          ? marked(post.content)
          : post.content)
      : marked(post.content)
  }

  const jsonFile = `${answers.filename}.json`
  const contentFile = `${answers.filename}.${getFileExtension(options)}`

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

function estimatedCost (model : string, post : Post) {
  const promptTokens = post.totalTokens.promptTokens
  const completionTokens = post.totalTokens.completionTokens

  return (model === 'gpt-4')
    ? Number(((promptTokens / 1000) * GPT4_PROMPT_PRICE) + ((completionTokens / 1000) * GPT4_COMPLETION_PRICE)).toFixed(4)
    : Number(((promptTokens / 1000) * GPT35_PROMPT_PRICE) + ((completionTokens / 1000) * GPT_COMPLETION_PRICE)).toFixed(4)
}

function isCustom (options : Options) {
  return options.templateFile !== undefined
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
