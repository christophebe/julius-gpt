import { z } from 'zod'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { BaseOutputParser, StringOutputParser } from '@langchain/core/output_parsers'
import { TemplatePostPrompt } from 'src/types'
import { isHTML, isMarkdown } from './template'

const HeadingSchema: z.ZodSchema<any> = z.object({
  title: z.string(),
  keywords: z.array(z.string()).optional(),
  headings: z.array(z.lazy(() => HeadingSchema)).optional()
})

const PostOutlineSchema = z.object({
  title: z.string(),
  headings: z.array(HeadingSchema),
  slug: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string()
})

const AudienceIntentSchema = z.object({
  audience: z.string(),
  intent: z.string()
})

const SeoInfoSchema = z.object({
  h1: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  slug: z.string()
})

export class MarkdownOutputParser extends BaseOutputParser<string> {
  lc_namespace = ['julius', 'markdown']

  getFormatInstructions (): string {
    return `
    Your answer has to be only a markdown block. 
    The block has to delimited by \`\`\`markdown (beginning of the block) and \`\`\` (end of the block)
    `
  }

  async parse (text: string): Promise<string> {
    return Promise.resolve(this.extract_markdown_content(text))
  }

  extract_markdown_content (text: string): string {
    const pattern = /```markdown(.*?)```/s
    const match = text.match(pattern)
    if (match) {
      return match[1].trim()
    } else {
      return ''
    }
  }
}
export class HTMLOutputParser extends BaseOutputParser<string> {
  lc_namespace = ['julius', 'html']

  getFormatInstructions (): string {
    return `
    Your answer has to be only a HTML block. 
    The block has to delimited by \`\`\`html (beginning of the block) and \`\`\` (end of the block)
    `
  }

  async parse (text: string): Promise<string> {
    return Promise.resolve(this.extract_html_content(text))
  }

  extract_html_content (text: string): string {
    const pattern = /```html(.*?)```/s
    const match = text.match(pattern)
    if (match) {
      return match[1].trim()
    } else {
      return ''
    }
  }
}

export function getOutlineParser (): StructuredOutputParser<typeof PostOutlineSchema> {
  return StructuredOutputParser.fromZodSchema(PostOutlineSchema)
}

export function getAudienceIntentParser (): StructuredOutputParser<typeof AudienceIntentSchema> {
  return StructuredOutputParser.fromZodSchema(AudienceIntentSchema)
}

export function getSeoInfoParser (): StructuredOutputParser<typeof SeoInfoSchema> {
  return StructuredOutputParser.fromZodSchema(SeoInfoSchema)
}

export function getMarkdownParser (): MarkdownOutputParser {
  return new MarkdownOutputParser()
}
export function getHTMLParser (): HTMLOutputParser {
  return new HTMLOutputParser()
}

export function getStringParser (): StringOutputParser {
  return new StringOutputParser()
}

export function getParser (prompt : TemplatePostPrompt) : BaseOutputParser<string> {
  if (isMarkdown(prompt)) {
    return getMarkdownParser()
  }

  if (isHTML(prompt)) {
    return getHTMLParser()
  }

  return getStringParser()
}
