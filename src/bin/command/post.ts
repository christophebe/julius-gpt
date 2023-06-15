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
    // In custom mode, we don't want to render the content
    // We keep the content as it is in the template
    content: isCustomMode ? post.content : marked(post.content)
  }

  const writeJSONPromise = fs.promises.writeFile(`${answers.filename}.json`, JSON.stringify(jsonData), 'utf8')
  const writeDocPromise = fs.promises.writeFile(`${answers.filename}.${getFileExtension(options)}`, buildContent(options, post), 'utf8')
  await Promise.all([writeJSONPromise, writeDocPromise])

  console.log(`🔥 Content is created successfully in ${answers.filename}.*`)
  console.log(`- Slug : ${post.slug}`)
  console.log(`- SEO Title : ${post.seoTitle}`)
  console.log(`- SEO Description : ${post.seoDescription}`)
  console.log(`- Total prompts tokens : ${post.totalTokens.promptTokens}`)
  console.log(`- Total completion tokens : ${post.totalTokens.completionTokens}`)
  console.log(`- Estimated cost :  ${estimatedCost(postPrompt.model, post)}$`)
}

function buildContent (options : Options, post : Post) {
  return isCustom(options)
    ? post.content
    : '# ' + post.title + '\n' + post.content
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
