import * as dotenv from 'dotenv'
import { ChatOpenAI } from '@langchain/openai'
import { BufferMemory } from 'langchain/memory'
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts'
import { getOutlineParser } from './lib/parser'
import { getHumanOutlineTemplate, getSystemOutlineTemplate } from './lib/templates/template'

import {
  Heading,
  Post,
  PostOutline,
  PostPrompt
} from './types'

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
    this.llm_outline = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      verbose: postPrompt.debug
    })

    this.llm_content = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      frequencyPenalty: postPrompt.frequencyPenalty ?? 0,
      presencePenalty: postPrompt.presencePenalty ?? 1,
      verbose: postPrompt.debug
    })

    this.memory = new BufferMemory({
      returnMessages: true
    })
  }

  public async generate () : Promise<Post> {
    const tableOfContent = await this.generateOutline()
    console.log(tableOfContent)
    return {
      title: tableOfContent.title,
      content: '',
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

  public async generateOutline (): Promise<PostOutline> {
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
      // .pipe(this.memory)
    const outline = await chain.invoke(inputVariables)

    this.memory.saveContext(
      { 'blog post request': this.promptToString(this.postPrompt) },
      { 'post outline': this.postOutlineToMarkdown(outline) }
    )
    return outline
  }

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
