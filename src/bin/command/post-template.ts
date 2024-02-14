import fs from 'fs'
import { Command } from 'commander'
import { marked as markdownToHTML } from 'marked'
import { PostTemplateGenerator } from '../../post-generator'
import { TemplatePost, TemplatePostPrompt } from 'src/types'
import { getFileExtension, isHTML, isMarkdown } from 'src/lib/template'

type Options = {
  debug: boolean
  debugapi: boolean
  apiKey: string
  templateFile: string
  model: 'gpt-4-turbo-preview' | 'gpt-4' | 'gpt-3.5-turbo'
  filename: string
  temperature: number
  frequencyPenalty: number
  presencePenalty: number
  logitBias: number
}

export function buildPostTemplateCommands (program: Command) {
  program.command('template-post')
    .description('Generate a post based on a content template')
    .option('-t, --templateFile <file>', 'Set the template file (optional)')
    .option('-m, --model <model>', 'Set the LLM : "gpt-4-turbo-preview" | "gpt-4" | "gpt-3.5-turbo" (optional), gpt-4-turbo-preview by default')
    .option('-f, --filename <filename>', 'Set the post file name (optional)')
    .option('-tt, --temperature <temperature>', 'Set the temperature (optional)')
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
    content: isMarkdown(options)
      ? markdownToHTML(post.content)
      : post.content
  }

  const jsonFile = `${postPrompt.filename}.json`
  const contentFile = `${postPrompt.filename}.${getFileExtension(options)}`

  const writeJSONPromise = fs.promises.writeFile(jsonFile, JSON.stringify(jsonData), 'utf8')
  const writeDocPromise = fs.promises.writeFile(contentFile, buildContent(options, post), 'utf8')
  await Promise.all([writeJSONPromise, writeDocPromise])

  console.log(`🔥 Content is successfully generated in the file : ${contentFile}. Use the file ${jsonFile} to publish the content on Wordpress.`)
  console.log(`- Slug : ${post.slug}`)
  console.log(`- SEO Title : ${post.seoTitle}`)
  console.log(`- SEO Description : ${post.seoDescription}`)
}

function buildDefaultPostPrompt () {
  return {
    model: 'gpt-4-turbo-preview',
    temperature: 0.8,
    frequencyPenalty: 0,
    presencePenalty: 1,
    logitBias: 0
  }
}

function buildContent (prompt : TemplatePostPrompt, post: TemplatePost) {
  return isHTML(prompt)
    ? buildHTMLPage(post)
    : buildMDPage(post)
}

function buildMDPage (post: TemplatePost) {
  return post.content
}

function buildHTMLPage (post: TemplatePost) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${post.seoTitle}</title>
    <meta name="description" content="${post.seoDescription}">
  </head>
  <body>
    ${post.content}
  </body>
  </html>
  `
}
