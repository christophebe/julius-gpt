import { z } from 'zod'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { BaseOutputParser } from '@langchain/core/output_parsers'

const HeadingShema: z.ZodSchema<any> = z.object({
  title: z.string(),
  keywords: z.array(z.string()).optional(),
  headings: z.array(z.lazy(() => PostOutlineShema)).optional()
})

const PostOutlineShema = z.object({
  title: z.string(),
  headings: z.array(HeadingShema),
  slug: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string()
})

export class MarkdownOutputParser extends BaseOutputParser<string> {
  lc_namespace = ['julius', 'markdown']

  getFormatInstructions (): string {
    return `
              Your answer has to be only a markdown block. 
              The block has to delimited by \`\`\`markdown (beginning of the block) and \`\`\` (end of the block)
              The content of this block has to be correctly formatted based on the markdown syntax.
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

export function getOutlineParser (): StructuredOutputParser<typeof PostOutlineShema> {
  return StructuredOutputParser.fromZodSchema(PostOutlineShema)
}

export function getMarkdownParser (): MarkdownOutputParser {
  return new MarkdownOutputParser()
}
