import fs from 'fs'
import { Command } from 'commander'
import { marked as markdownToHTML } from 'marked'
import { PostTemplateGenerator } from '../../post-generator'
import { DEFAULT_LLM, TemplatePostPrompt, getLLMs, llm } from 'src/types'
import { getFileExtension, isMarkdown } from 'src/lib/template'

type Options = {
  debug: boolean
  debugapi: boolean
  apiKey: string
  templateFile: string
  promptFolder: string
  model: llm
  filename: string
  temperature: number
  frequencyPenalty: number
  presencePenalty: number
  logitBias: number
  input: any
}

export function buildPostTemplateCommands (program: Command) {
  program.command('template-post')
    .description('Generate a post based on a content template')
    .option('-t, --templateFile <file>', 'Set the template file (optional)')
    .option('-i, --input <items>', 'input option', (value, previous) => {
      const pairs = value.split(',')
      const obj = pairs.reduce((acc: { [key: string]: string }, pair: string) => {
        const [key, val] = pair.split('=')
        acc[key] = val
        return acc
      }, {})
      return { ...previous, ...obj }
    }, {})
    .option('-m, --model <model>', `Set the LLM : ${getLLMs().join('|  ')}`)

    .option('-f, --filename <filename>', 'Set the post file name (optional)')
    .option('-tt, --temperature <temperature>', 'Set the temperature (optional)')
    .option('-fp, --frequencypenalty <frequencyPenalty>', 'Set the frequency penalty (optional)')
    .option('-pp, --presencepenalty <presencePenalty>', 'Set the presence penalty (optional)')
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
  const defaultPostPrompt = buildDefaultPostPrompt()

  const postPrompt: TemplatePostPrompt = {
    ...defaultPostPrompt,
    ...options

  }

  const postGenerator = new PostTemplateGenerator(postPrompt)
  const post = await postGenerator.generate()

  const jsonData = {
    ...post,
    content: isMarkdown(postPrompt)
      ? markdownToHTML(post.content)
      : post.content
  }

  const jsonFile = `${postPrompt.filename}.json`
  const contentFile = `${postPrompt.filename}.${getFileExtension(postPrompt)}`

  const writeJSONPromise = fs.promises.writeFile(jsonFile, JSON.stringify(jsonData), 'utf8')
  const writeDocPromise = fs.promises.writeFile(contentFile, post.content, 'utf8')
  await Promise.all([writeJSONPromise, writeDocPromise])

  console.log(`🔥 Content is successfully generated in the file : ${contentFile}. Use the file ${jsonFile} to publish the content on Wordpress.`)
  console.log(`- Slug : ${post.slug}`)
  console.log(`- SEO Title : ${post.seoTitle}`)
  console.log(`- SEO Description : ${post.seoDescription}`)
}

function buildDefaultPostPrompt () {
  return {
    model: DEFAULT_LLM,
    temperature: 0.8,
    frequencyPenalty: 0,
    presencePenalty: 1
  }
}
