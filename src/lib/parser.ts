import { z } from 'zod'
import { StructuredOutputParser } from 'langchain/output_parsers'

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

export function getOutlineParser (): StructuredOutputParser<typeof PostOutlineShema> {
  return StructuredOutputParser.fromZodSchema(PostOutlineShema)
}
