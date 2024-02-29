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
  MessagesPlaceholder,
  PromptTemplate
} from '@langchain/core/prompts'

import { RunnableSequence } from '@langchain/core/runnables'

import {
  Heading,
  Post,
  PostOutline,
  AutoPostPrompt,
  TemplatePostPrompt,
  TemplatePost
} from './types'

import { createIdLogger as createLogger } from './lib/log'

import { getAudienceIntentParser, getMarkdownParser, getOutlineParser, getParser, getSeoInfoParser } from './lib/parser'

import {
  getConclusionPrompt,
  getHeadingPrompt,
  getOutlinePrompt,
  getIntroductionPrompt,
  getSystemPrompt,
  getAudienceIntentPrompt,
  getSeoInfoPrompt
} from './lib/prompt'

import { Template } from './lib/template'

dotenv.config()
const readFile = promisify(rd)
const DEFAULT_PROMPT_FOLDER = './prompts'
const PARSER_INSTRUCTIONS_TAG = '\n{formatInstructions}\n'

// -----------------------------------------------------------------------------------------
// The following class can be used to generate the post in the auto mode.
// The content is structured as follows :
// - Introduction
// - Headings with their content
// - Conclusion (optional)
// -----------------------------------------------------------------------------------------
export class PostGenerator {
  private llm_json: ChatOpenAI
  private llm_content: ChatOpenAI
  private memory : BufferMemory
  private log
  private promptFolder: string

  public constructor (private postPrompt: AutoPostPrompt) {
    this.log = createLogger(postPrompt.debug ? 'debug' : 'info')

    this.promptFolder = postPrompt.promptFolder ?? path.join(__dirname, DEFAULT_PROMPT_FOLDER)

    this.llm_content = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      frequencyPenalty: postPrompt.frequencyPenalty ?? 0,
      presencePenalty: postPrompt.presencePenalty ?? 1,
      verbose: postPrompt.debugapi,
      openAIApiKey: postPrompt.apiKey
    })

    // For the outline, we use a different setting without frequencyPenalty and presencePenalty
    // in order to avoid some json format issue
    this.llm_json = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      verbose: postPrompt.debugapi,
      openAIApiKey: postPrompt.apiKey
    })

    this.memory = new BufferMemory({
      returnMessages: true
    })
  }

  public async generate (): Promise<Post> {
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
      h1: tableOfContent.title,
      content,
      seoTitle: tableOfContent.seoTitle,
      seoDescription: tableOfContent.seoDescription,
      slug: tableOfContent.slug
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

  // ---------------------------------------------------------------------------
  // Other methods
  // ---------------------------------------------------------------------------

  /**
   * Convert a post prompt to a string for adding to the memory.
   */
  private promptToString (prompt : AutoPostPrompt): string {
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
  * Debug the memory
  */
  private async debugMemory (step: string) {
    this.log.debug(step + '\n' + JSON.stringify(await this.memory.loadMemoryVariables({}), null, 2))
  }
}

// -----------------------------------------------------------------------------------------
// The following class can be  used to generate the post based on a template.
// A template is a file containing prompts that will be replaced by the content
// -----------------------------------------------------------------------------------------
export class PostTemplateGenerator {
  private llm_content: ChatOpenAI
  private llm_json: ChatOpenAI
  private memory: BufferMemory
  private log
  private promptFolder: string

  public constructor (private postPrompt: TemplatePostPrompt) {
    this.log = createLogger(postPrompt.debug ? 'debug' : 'info')

    this.promptFolder = postPrompt.promptFolder ?? path.join(__dirname, DEFAULT_PROMPT_FOLDER)

    this.llm_content = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      frequencyPenalty: postPrompt.frequencyPenalty ?? 0,
      presencePenalty: postPrompt.presencePenalty ?? 0,
      verbose: postPrompt.debugapi,
      openAIApiKey: postPrompt.apiKey
    })

    this.llm_json = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      verbose: postPrompt.debugapi,
      openAIApiKey: postPrompt.apiKey

    })

    this.memory = new BufferMemory({
      returnMessages: true
    })
  }

  public async generate (): Promise<TemplatePost> {
    this.log.info(`Generate the post based on the template : ${this.postPrompt.templateFile}`)
    this.log.debug('\nPrompt :' + JSON.stringify(this.postPrompt, null, 2))

    const templateContent = await this.readTemplate()

    const template = new Template(templateContent)

    // Add the system prompt to the memory
    const systemPrompt = PromptTemplate.fromTemplate(template.getSystemPrompt())

    this.memory.saveContext(
      { input: 'Write the content for the blog post based on the following recommendations' },
      { output: await systemPrompt.format(this.postPrompt.input) }
    )

    const contents: string[] = []
    for (const [index, prompt] of template.getPrompts().entries()) {
      if (prompt.type === 'i') {
        // NOT IMPLEMENTED YET
        continue
      }
      this.log.info(`Generating content for prompt ${index + 1} ...`)
      const content = await this.generateTemplateContent(prompt.prompt)
      contents.push(content)
    }

    const content = template.buildContent(contents)
    const { h1, seoTitle, seoDescription, slug } = await this.generateSeoInfo(content)

    return {
      h1,
      content,
      seoTitle,
      seoDescription,
      slug
    }
  }

  private async generateTemplateContent (prompt: string): Promise<string> {
    const parser = getParser(this.postPrompt)

    const promptWithInstructions = prompt + PARSER_INSTRUCTIONS_TAG

    const chatPrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate(promptWithInstructions)
    ])
    const inputVariables: { [key: string]: (initialInput: string) => string } = {}

    for (const attribute in this.postPrompt.input) {
      if (typeof this.postPrompt.input[attribute] === 'string') {
        inputVariables[attribute] = (initialInput : any) => initialInput[attribute as keyof string]
      }
    }
    const chain = RunnableSequence.from([
      {
        ...inputVariables,
        formatInstructions: (initialInput) => initialInput.formatInstructions,
        memory: () => this.memory.loadMemoryVariables({})
      },
      {
        ...inputVariables,
        formatInstructions: (initialInput) => initialInput.formatInstructions,
        history: (previousOutput) => previousOutput.memory.history
      },
      chatPrompt,
      this.llm_content,
      parser
    ])

    const inputs = {
      formatInstructions: parser.getFormatInstructions(),
      ...this.postPrompt.input
    }

    const content = await chain.invoke(inputs)
    this.memory.saveContext(
      { input: prompt },
      { output: content }
    )

    return content
  }

  private async generateSeoInfo (content : string): Promise<{ h1: string, seoTitle: string, seoDescription : string, slug : string }> {
    const parser = getSeoInfoParser()

    const humanTemplate = await getSeoInfoPrompt(this.promptFolder)
    const chatPrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate(humanTemplate)
    ])

    const chain = RunnableSequence.from([
      {
        content: (initialInput) => initialInput.content,
        formatInstructions: (initialInput) => initialInput.formatInstructions,
        memory: () => this.memory.loadMemoryVariables({})
      },
      {

        content: (initialInput) => initialInput.content,
        formatInstructions: (initialInput) => initialInput.formatInstructions,
        history: (previousOutput) => previousOutput.memory.history
      },
      chatPrompt,
      this.llm_json,
      parser
    ])

    const inputVariables = {
      content,
      formatInstructions: parser.getFormatInstructions()
    }

    const seoInfo = await chain.invoke(inputVariables)
    this.memory.saveContext(
      { input: 'Generate the seo information : H1, title, description and slug' },
      { output: JSON.stringify(content, null, 2) }
    )

    return seoInfo
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
}
