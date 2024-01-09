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
import { getConclusionTemplate, getHumanOutlineTemplate, getIntroductionTemplate, getSystemOutlineTemplate } from './lib/templates/template'

import {
  Heading,
  Post,
  PostOutline,
  PostPrompt
} from './types'
import { RunnableSequence } from '@langchain/core/runnables'

dotenv.config()

/**
 * Class for generating a post.
 */
export class PostGenerator {
  private llm_outline: ChatOpenAI
  private llm_content: ChatOpenAI
  private memory : BufferMemory

  // private completionParams : CompletionParams
  public constructor (private postPrompt: PostPrompt) {
    this.llm_content = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      frequencyPenalty: postPrompt.frequencyPenalty ?? 0,
      presencePenalty: postPrompt.presencePenalty ?? 1,
      verbose: postPrompt.debug
    })

    // For the outline, we use a different setting without frequencyPenalty and presencePenalty
    // in order to avoid some issues with the outline generation (in json format)
    this.llm_outline = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      verbose: postPrompt.debug
    })

    this.memory = new BufferMemory({
      returnMessages: true
    })
  }

  /**
   * Generate a post.
   */
  public async generate () : Promise<Post> {
    const tableOfContent = await this.generateOutline()
    const introduction = await this.generateIntroduction()
    const conclusion = await this.generateConclusion()
    // console.log(tableOfContent)
    const content = `
      ${introduction}
       
      ${conclusion}
    `
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
      format_instructions: parser.getFormatInstructions(),
      topic: this.postPrompt.topic,
      language: this.postPrompt.language,
      country: this.postPrompt.country,
      audience: this.postPrompt.audience,
      intent: this.postPrompt.intent,
      tone: this.postPrompt.tone
    }

    const chain = chatPrompt
      .pipe(this.llm_outline)
      .pipe(parser)

    const outline = await chain.invoke(inputVariables)

    this.memory.saveContext(
      { input: this.promptToString(this.postPrompt) },
      { output: this.postOutlineToMarkdown(outline) }
    )
    return outline
  }

  async generateIntroduction (): Promise<string> {
    const template = await getIntroductionTemplate(this.postPrompt.templateFolder)
    return await this.generateMarkdown(template, 'Write the introduction of the blog post')
  }

  async generateConclusion (): Promise<string> {
    const template = await getConclusionTemplate(this.postPrompt.templateFolder)
    return await this.generateMarkdown(template, 'Write the conclusion of the blog post')
  }

  /**
   *
   * Generate a content in markdown format based on a template
   *
   */
  async generateMarkdown (template : string, memoryInput : string): Promise<string> {
    const parser = getMarkdownParser()

    const chatPrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate(template)
    ])

    console.log(await this.memory.loadMemoryVariables({}))

    const chain = RunnableSequence.from([
      {
        language: (initialInput) => initialInput.language,
        topic: (initialInput) => initialInput.topic,
        format_instructions: (initialInput) => initialInput.format_instructions,
        memory: () => this.memory.loadMemoryVariables({})
      },
      {
        language: (initialInput) => initialInput.language,
        topic: (initialInput) => initialInput.topic,
        format_instructions: (initialInput) => initialInput.format_instructions,
        history: (previousOutput) => previousOutput.memory.history
      },
      chatPrompt,
      this.llm_content,
      parser
    ])

    const inputVariables = {
      format_instructions: parser.getFormatInstructions(),
      topic: this.postPrompt.topic,
      language: this.postPrompt.language
    }

    const content = await chain.invoke(inputVariables)
    console.log(await this.memory.loadMemoryVariables({}))
    this.memory.saveContext(
      { input: memoryInput },
      { output: content }
    )

    return content

    // const chain = RunnableSequence.from([
    //   {
    //     input: (initialInput) => initialInput.input,
    //     memory: () => this.memory.loadMemoryVariables({})
    //   },
    //   {
    //     input: (previousOutput) => previousOutput.input,
    //     history: (previousOutput) => previousOutput.memory.history
    //   },
    //   chatPrompt,
    //   this.llm_content,
    //   parser
    // ])
  }

  /**
   * Convert a post prompt to a string.
   */
  promptToString (prompt : PostPrompt): string {
    return `
      Blog post request : 
      - Topic: ${prompt.topic}
      - ${prompt.language ? `Language: ${prompt.language}` : ''}
      - ${prompt.country ? `Country: ${prompt.country}` : ''}
      - ${prompt.intent ? `Intent: ${prompt.intent}` : ''}
      - ${prompt.audience ? `Audience: ${prompt.audience}` : ''}
      - ${prompt.tone ? `Tone: ${prompt.tone}` : ''}  
    `
  }

  /**
   * Convert a post outline to a markdown string.
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
}
