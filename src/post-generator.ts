import * as dotenv from 'dotenv'
import { ChatOpenAI } from '@langchain/openai'
import { BufferMemory } from 'langchain/memory'
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder
} from '@langchain/core/prompts'

import { getMarkdownParser, getOutlineParser } from './lib/parser'
import { getConclusionTemplate, getHeadingTemplate, getHumanOutlineTemplate, getIntroductionTemplate, getSystemOutlineTemplate } from './lib/templates/template'

import {
  Heading,
  Post,
  PostOutline,
  PostPrompt
} from './types'
import { RunnableSequence } from '@langchain/core/runnables'
import { createIdLogger as createLogger } from './lib/log'

dotenv.config()

/**
 * Class for generating a post.
 */
export class PostGenerator {
  private llm_outline: ChatOpenAI
  private llm_content: ChatOpenAI
  private memory : BufferMemory
  private log

  // private completionParams : CompletionParams
  public constructor (private postPrompt: PostPrompt) {
    this.log = createLogger(postPrompt.debug ? 'debug' : 'info')

    this.llm_content = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      frequencyPenalty: postPrompt.frequencyPenalty ?? 0,
      presencePenalty: postPrompt.presencePenalty ?? 1,
      verbose: postPrompt.debugapi
    })

    // For the outline, we use a different setting without frequencyPenalty and presencePenalty
    // in order to avoid some issues with the outline generation (in json format)
    this.llm_outline = new ChatOpenAI({
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
    this.log.debug('\nPrompt :' + JSON.stringify(this.postPrompt, null, 2))
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
   * Generate a post outline.
   */
  async generateOutline (): Promise<PostOutline> {
    const parser = getOutlineParser()

    const sysTemplate = await getSystemOutlineTemplate(this.postPrompt.templateFolder)
    const humanTemplate = await getHumanOutlineTemplate(this.postPrompt.templateFolder)
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
      .pipe(this.llm_outline)
      .pipe(parser)

    const outline = await chain.invoke(inputVariables)

    this.memory.saveContext(
      { input: this.promptToString(this.postPrompt) },
      { output: this.postOutlineToMarkdown(outline) }
    )
    await this.debugMemory('memory after outline')
    return outline
  }

  async generateIntroduction (): Promise<string> {
    const template = await getIntroductionTemplate(this.postPrompt.templateFolder)
    const content = await this.generateContent(template, 'Write the introduction of the blog post')
    await this.debugMemory('memory after intro')
    return content
  }

  async generateConclusion (): Promise<string> {
    const template = await getConclusionTemplate(this.postPrompt.templateFolder)
    const content = await this.generateContent(template, 'Write the conclusion of the blog post')
    await this.debugMemory('memory after conclusion')
    return content
  }

  async generateHeadingContents (postOutline: PostOutline) {
    const headingLevel = 2

    return await this.buildContent(postOutline.headings, headingLevel)
  }

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

  private async generateHeadingContent (heading: Heading): Promise<string> {
    this.log.info(` - Generating content for heading : ${heading.title}`)
    const template = await getHeadingTemplate(this.postPrompt.templateFolder)
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
   * Generate a content in markdown format based on a template
   * Mainly used for the introduction and conclusion
   *
   */
  async generateContent (template : string, memoryInput : string): Promise<string> {
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

  /**
   * Convert a post prompt to a string for adding to the memory.
   */
  promptToString (prompt : PostPrompt): string {
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
  postOutlineToMarkdown (postOutline: PostOutline): string {
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

  async debugMemory (step: string) {
    this.log.debug(step + '\n' + JSON.stringify(await this.memory.loadMemoryVariables({}), null, 2))
  }
}
