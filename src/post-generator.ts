import * as dotenv from 'dotenv'
import { readFile as rd } from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { ChatOpenAI } from '@langchain/openai'
import { BufferMemory } from 'langchain/memory'
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder
} from '@langchain/core/prompts'

import { RunnableSequence } from '@langchain/core/runnables'

import {
  Heading,
  Post,
  PostOutline,
  PostPrompt
} from './types'

import { createIdLogger as createLogger } from './lib/log'

import { getAudienceIntentParser, getMarkdownParser, getOutlineParser, getStringParser } from './lib/parser'

import {
  getConclusionPrompt,
  getHeadingPrompt,
  getOutlinePrompt,
  getIntroductionPrompt,
  getSystemPrompt,
  getAudienceIntentPrompt
} from './lib/prompt'
import { extractPrompts, replaceAllPrompts } from './lib/templates/template-prompt'

dotenv.config()
const readFile = promisify(rd)
const DEFAULT_PROMPT_FOLDER = './prompts'
/**
 * Class for generating a post.
 */
export class PostGenerator {
  private llm_json: ChatOpenAI
  private llm_content: ChatOpenAI
  private memory : BufferMemory
  private log
  private promptFolder: string

  public constructor (private postPrompt: PostPrompt) {
    this.log = createLogger(postPrompt.debug ? 'debug' : 'info')

    this.promptFolder = postPrompt.promptFolder ?? path.join(__dirname, DEFAULT_PROMPT_FOLDER)

    this.llm_content = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      frequencyPenalty: postPrompt.frequencyPenalty ?? 0,
      presencePenalty: postPrompt.presencePenalty ?? 1,
      verbose: postPrompt.debugapi
    })

    // For the outline, we use a different setting without frequencyPenalty and presencePenalty
    // in order to avoid some issues with the outline generation (in json format)
    this.llm_json = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      verbose: postPrompt.debugapi
    })

    this.memory = new BufferMemory({
      returnMessages: true
    })
  }

  /**
   * Generate a post.
   */
  public async generate () : Promise<Post> {
    if (this.isWithTemplate()) {
      return this.generateWithTemplate()
    } else {
      return this.generatePost()
    }
  }

  // ---------------------------------------------------------------------------
  // The following methods are used to generate the post in the auto mode.
  // The content is structured as follows :
  // - Introduction
  // - Headings with their content
  // - Conclusion (optional)
  // ---------------------------------------------------------------------------

  private async generatePost (): Promise<Post> {
    this.log.debug('\nPrompt :' + JSON.stringify(this.postPrompt, null, 2))
    if (this.postPrompt.generate) {
      this.log.info('Generating the audience and the intent')
      const { audience, intent } = await this.generateAudienceAndIntent()
      this.postPrompt.audience = audience
      this.postPrompt.intent = intent
      this.log.debug('Audience : ' + audience)
      this.log.debug('Intent : ' + intent)
    }

    this.log.info('Generating the outline for the topic : ' + this.postPrompt.topic)
    const tableOfContent = await this.generateOutline()

    this.log.info('Generating the introduction')
    const introduction = await this.generateIntroduction()

    this.log.info('Generating the headings : ')
    const headingContents = await this.generateHeadingContents(tableOfContent)

    this.log.info('Generating the conclusion')
    const conclusion = await this.generateConclusion()

    const content = `${introduction}\n${headingContents}\n${conclusion}`
    return {
      title: tableOfContent.title,
      content,
      seoTitle: tableOfContent.seoTitle,
      seoDescription: tableOfContent.seoDescription,
      slug: tableOfContent.slug,
      totalTokens: {
        completionTokens: 0,
        promptTokens: 0,
        total: 0
      }
    }
  }

  /**
   * Generate the audience and intent.
   */
  async generateAudienceAndIntent (): Promise<{ audience: string, intent: string }> {
    const parser = getAudienceIntentParser()

    const sysTemplate = await getSystemPrompt(this.promptFolder)
    const humanTemplate = await getAudienceIntentPrompt(this.promptFolder)
    const chatPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(sysTemplate),
      HumanMessagePromptTemplate.fromTemplate(humanTemplate)
    ])

    const inputVariables = {
      formatInstructions: parser.getFormatInstructions(),
      topic: this.postPrompt.topic,
      language: this.postPrompt.language
    }

    const chain = chatPrompt
      .pipe(this.llm_json)
      .pipe(parser)

    const output = await chain.invoke(inputVariables)
    return output
  }

  /**
   * Generate a post outline.
   */
  private async generateOutline (): Promise<PostOutline> {
    const parser = getOutlineParser()

    const sysTemplate = await getSystemPrompt(this.promptFolder)
    const humanTemplate = await getOutlinePrompt(this.promptFolder)
    const chatPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(sysTemplate),
      HumanMessagePromptTemplate.fromTemplate(humanTemplate)
    ])

    const inputVariables = {
      formatInstructions: parser.getFormatInstructions(),
      topic: this.postPrompt.topic,
      language: this.postPrompt.language,
      country: this.postPrompt.country,
      audience: this.postPrompt.audience,
      intent: this.postPrompt.intent
    }

    const chain = chatPrompt
      .pipe(this.llm_json)
      .pipe(parser)

    const outline = await chain.invoke(inputVariables)

    this.memory.saveContext(
      { input: this.promptToString(this.postPrompt) },
      { output: this.postOutlineToMarkdown(outline) }
    )
    await this.debugMemory('memory after outline')
    return outline
  }

  /*
  * Generate the introduction of the blog post
  */
  private async generateIntroduction (): Promise<string> {
    const template = await getIntroductionPrompt(this.promptFolder)
    const content = await this.generateContent(template, 'Write the introduction of the blog post')
    await this.debugMemory('memory after intro')
    return content
  }

  /*
  * Generate the conclusion of the blog post
  */
  private async generateConclusion (): Promise<string> {
    const template = await getConclusionPrompt(this.promptFolder)
    const content = await this.generateContent(template, 'Write the conclusion of the blog post')
    await this.debugMemory('memory after conclusion')
    return content
  }

  /*
  * Generate the content for the headings of the blog post
  */
  private async generateHeadingContents (postOutline: PostOutline) {
    const headingLevel = 2

    return await this.buildContent(postOutline.headings, headingLevel)
  }

  /*
  * Build the content for the headings of the blog post
  */
  private async buildContent (headings: Heading[], headingLevel: number, previousContent: string = ''): Promise<string> {
    if (headings.length === 0) {
      return previousContent
    }
    const [currentHeading, ...remainingHeadings] = headings

    const mdHeading = Array(headingLevel).fill('#').join('')
    let content = previousContent + '\n' + mdHeading + ' ' + currentHeading.title

    if (currentHeading.headings && currentHeading.headings.length > 0) {
      content = await this.buildContent(currentHeading.headings, headingLevel + 1, content)
    } else {
      content += '\n' + await this.generateHeadingContent(currentHeading)
    }

    return this.buildContent(remainingHeadings, headingLevel, content)
  }

  /*
  * Generate the content for a heading
  */
  private async generateHeadingContent (heading: Heading): Promise<string> {
    this.log.info(` - Generating content for heading : ${heading.title}`)
    const template = await getHeadingPrompt(this.promptFolder)
    const parser = getMarkdownParser()

    const chatPrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate(template)
    ])

    const chain = RunnableSequence.from([
      {
        language: (initialInput) => initialInput.language,
        headingTitle: (initialInput) => initialInput.headingTitle,
        keywords: (initialInput) => initialInput.keywords,
        formatInstructions: (initialInput) => initialInput.formatInstructions,
        memory: () => this.memory.loadMemoryVariables({})
      },
      {
        language: (initialInput) => initialInput.language,
        headingTitle: (initialInput) => initialInput.headingTitle,
        keywords: (initialInput) => initialInput.keywords,
        formatInstructions: (initialInput) => initialInput.formatInstructions,
        history: (previousOutput) => previousOutput.memory.history
      },
      chatPrompt,
      this.llm_content,
      parser
    ])

    const inputVariables = {
      formatInstructions: parser.getFormatInstructions(),
      headingTitle: heading.title,
      language: this.postPrompt.language,
      keywords: heading.keywords?.join(', ')
    }

    const content = await chain.invoke(inputVariables)
    this.memory.saveContext(
      { input: `Write a content for the heading : ${heading.title}` },
      { output: content }
    )
    await this.debugMemory('memory after heading' + heading.title)

    return content
  }

  /**
   *
   * Generate a content in markdown format based on a langchain template
   * Mainly used for the introduction and conclusion
   *
   */
  private async generateContent (template : string, memoryInput : string): Promise<string> {
    const parser = getMarkdownParser()

    const chatPrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate(template)
    ])

    const chain = RunnableSequence.from([
      {
        language: (initialInput) => initialInput.language,
        topic: (initialInput) => initialInput.topic,
        formatInstructions: (initialInput) => initialInput.formatInstructions,
        memory: () => this.memory.loadMemoryVariables({})
      },
      {
        language: (initialInput) => initialInput.language,
        topic: (initialInput) => initialInput.topic,
        formatInstructions: (initialInput) => initialInput.formatInstructions,
        history: (previousOutput) => previousOutput.memory.history
      },
      chatPrompt,
      this.llm_content,
      parser
    ])

    const inputVariables = {
      formatInstructions: parser.getFormatInstructions(),
      topic: this.postPrompt.topic,
      language: this.postPrompt.language
    }

    const content = await chain.invoke(inputVariables)
    this.memory.saveContext(
      { input: memoryInput },
      { output: content }
    )

    return content
  }

  // -----------------------------------------------------------------------------
  // The following methods are used to generate the post based on a template
  // A template is a file containing prompts that will be replaced by the content
  // -----------------------------------------------------------------------------

  /*
  * Generate the post based on a template
  */
  private async generateWithTemplate (): Promise<Post> {
    const promptContents: string[] = []

    this.log.info(`Generate the post based on the template : ${this.postPrompt.templateFile}`)

    const templateContent = await this.readTemplate()
    let prompts = extractPrompts(templateContent)

    // Add the first prompt in the memory (system prompt)
    this.memory.saveContext(
      { input: 'Write the content for the blog post based on the following recommendations' },
      { output: prompts[0] }
    )
    // We remove the first prompt because it is the system prompt
    prompts = prompts.slice(1)

    // for each prompt, we generate the content
    const templatePrompts = prompts.entries()
    for (const [index, prompt] of templatePrompts) {
      this.log.info(`Generating the prompt num. ${index + 1} ...`)
      const content = await this.generateTemplateContent(prompt)
      promptContents.push(content)
    }

    const content = replaceAllPrompts(templateContent, promptContents)

    return {
      title: '',
      content,
      seoTitle: '',
      seoDescription: '',
      slug: '',
      totalTokens: {
        completionTokens: 0,
        promptTokens: 0,
        total: 0
      }
    }
  }

  private async generateTemplateContent (template: string): Promise<string> {
    const parser = getStringParser()

    const chatPrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate(template)
    ])

    const chain = RunnableSequence.from([
      {
        // language: (initialInput) => initialInput.language,
        // headingTitle: (initialInput) => initialInput.headingTitle,
        // keywords: (initialInput) => initialInput.keywords,
        // formatInstructions: (initialInput) => initialInput.formatInstructions,
        memory: () => this.memory.loadMemoryVariables({})
      },
      {
        // language: (initialInput) => initialInput.language,
        // headingTitle: (initialInput) => initialInput.headingTitle,
        // keywords: (initialInput) => initialInput.keywords,
        // formatInstructions: (initialInput) => initialInput.formatInstructions,
        history: (previousOutput) => previousOutput.memory.history
      },
      chatPrompt,
      this.llm_content,
      parser
    ])

    // const inputVariables = {
    // formatInstructions: parser.getFormatInstructions(),
    // headingTitle: heading.title,
    // language: this.postPrompt.language,
    // keywords: heading.keywords?.join(', ')
    // }

    // const content = await chain.invoke(inputVariables)
    const content = await chain.invoke({})
    // this.memory.saveContext(
    //   { input: `Write a content for the heading : ${heading.title}` },
    //   { output: content }
    // )
    // await this.debugMemory('memory after heading' + heading.title)

    return content
  }

  /*
  * Read the template file
  */
  private async readTemplate (): Promise<string> {
    if (!this.postPrompt?.templateFile) {
      throw new Error('Template file is undefined.')
    }

    return await readFile(this.postPrompt.templateFile, 'utf-8')
  }

  // ---------------------------------------------------------------------------
  // Other methods
  // ---------------------------------------------------------------------------

  /**
   * Convert a post prompt to a string for adding to the memory.
   */
  private promptToString (prompt : PostPrompt): string {
    return `
      Blog post request : 
      - Topic: ${prompt.topic}
      - ${prompt.language ? `Language: ${prompt.language}` : ''}
      - ${prompt.country ? `Country: ${prompt.country}` : ''}
      - ${prompt.intent ? `Intent: ${prompt.intent}` : ''}
      - ${prompt.audience ? `Audience: ${prompt.audience}` : ''}
    `
  }

  /**
   * Convert a post outline to a markdown string for adding to the memory.
   */
  private postOutlineToMarkdown (postOutline: PostOutline): string {
    function headingsToMarkdown (headings: Heading[], level: number): string {
      return headings.map(heading => {
        const title = `${'#'.repeat(level)} ${heading.title}\n`
        const keywords = heading.keywords ? `Keywords: ${heading.keywords.join(', ')}\n` : ''
        const subheadings = heading.headings ? headingsToMarkdown(heading.headings, level + 1) : ''
        return `${title}${keywords}${subheadings}`
      }).join('\n')
    }

    const title = `# ${postOutline.title}\n`
    const headings = headingsToMarkdown(postOutline.headings, 2)
    const slug = `Slug: ${postOutline.slug}\n`
    const seoTitle = `SEO Title: ${postOutline.seoTitle}\n`
    const seoDescription = `SEO Description: ${postOutline.seoDescription}\n`

    return `
      Blog post outline :
      ${title}${headings}${slug}${seoTitle}${seoDescription}
    `
  }

  /*
  * Check if the post generation is based on a template
  */
  private isWithTemplate (): boolean {
    return this.postPrompt?.templateFile !== undefined
  }

  /*
  * Debug the memory
  */
  private async debugMemory (step: string) {
    this.log.debug(step + '\n' + JSON.stringify(await this.memory.loadMemoryVariables({}), null, 2))
  }
}
