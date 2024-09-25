import { z } from 'zod'
import { BaseOutputParser, StringOutputParser } from '@langchain/core/output_parsers'
import { TemplatePostPrompt } from 'src/types'
import { isHTML, isMarkdown } from './template'

type Heading = {
  title: string;
  keywords?: string[];
  headings?: Heading[];
};

const HeadingSchema: z.ZodType<Heading> = z.lazy(() =>
  z.object({
    title: z.string().describe('The title of the heading'),
    keywords: z.array(z.string()).optional().describe('The keywords of the heading'),
    headings: z.array(z.lazy(() => HeadingSchema)).optional().describe('The subheadings of the heading')
  })
);

export const PostOutlineSchema = z.object({
  title: z.string().describe('The title of the post'),
  headings: z.array(HeadingSchema).describe('The headings of the post'),
  slug: z.string().describe('The slug of the post'),
  seoTitle: z.string().describe('The SEO title of the post'),
  seoDescription: z.string().describe('The SEO description of the post')
})

export const AudienceIntentSchema = z.object({
  audience: z.string().describe('The audience of the post'),
  intent: z.string().describe('The intent of the post')
})

export const SeoInfoSchema = z.object({
  h1: z.string().describe('The H1 of the post'),
  seoTitle: z.string().describe('The SEO title of the post'),
  seoDescription: z.string().describe('The SEO description of the post'),
  slug: z.string().describe('The slug of the post')
})

export class MarkdownOutputParser extends BaseOutputParser<string> {
  lc_namespace = ['julius', 'markdown']

  getFormatInstructions(): string {
    return `
    Your answer has to be only a markdown block. 
    The block has to delimited by \`\`\`markdown (beginning of the block) and \`\`\` (end of the block)
    `
  }

  async parse(text: string): Promise<string> {
    return Promise.resolve(this.extract_markdown_content(text))
  }

  extract_markdown_content(text: string): string {
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

  getFormatInstructions(): string {
    return `
    Your answer has to be only a HTML block. 
    The block has to delimited by \`\`\`html (beginning of the block) and \`\`\` (end of the block)
    `
  }

  async parse(text: string): Promise<string> {
    return Promise.resolve(this.extract_html_content(text))
  }

  extract_html_content(text: string): string {
    const pattern = /```html(.*?)```/s
    const match = text.match(pattern)
    if (match) {
      return match[1].trim()
    } else {
      return ''
    }
  }
}



export function getMarkdownParser(): MarkdownOutputParser {
  return new MarkdownOutputParser()
}
export function getHTMLParser(): HTMLOutputParser {
  return new HTMLOutputParser()
}

export function getStringParser(): StringOutputParser {
  return new StringOutputParser()
}

export function getParser(prompt: TemplatePostPrompt): BaseOutputParser<string> {
  if (isMarkdown(prompt)) {
    return getMarkdownParser()
  }

  if (isHTML(prompt)) {
    return getHTMLParser()
  }

  return getStringParser()
}
