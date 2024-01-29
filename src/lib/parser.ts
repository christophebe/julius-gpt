import { z } from 'zod'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { BaseOutputParser } from '@langchain/core/output_parsers'

const HeadingSchema: z.ZodSchema<any> = z.object({
  title: z.string(),
  keywords: z.array(z.string()).optional(),
  headings: z.array(z.lazy(() => PostOutlineSchema)).optional()
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

export function getOutlineParser (): StructuredOutputParser<typeof PostOutlineSchema> {
  return StructuredOutputParser.fromZodSchema(PostOutlineSchema)
}

export function getAudienceIntentParser (): StructuredOutputParser<typeof AudienceIntentSchema> {
  return StructuredOutputParser.fromZodSchema(AudienceIntentSchema)
}

export function getMarkdownParser (): MarkdownOutputParser {
  return new MarkdownOutputParser()
}
