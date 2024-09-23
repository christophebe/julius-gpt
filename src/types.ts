export type llm =
  'gpt-4o' |
  'gpt-4o-mini' |
  'o1-preview' |
  'o1-mini' |
  'mistral-small-latest' |
  'mistral-medium-latest' |
  'mistral-large-latest' |
  'claude' |
  'groq'

export const DEFAULT_LLM: llm = 'gpt-4o'

export function getLLMs(): llm[] {
  return [
    'gpt-4o',
    'gpt-4o-mini',
    'o1-preview',
    'o1-mini',
    'mistral-small-latest',
    'mistral-medium-latest',
    'mistral-large-latest',
    'claude',
    'groq'
  ]
}

export type BasePostPrompt = {
  model: llm
  temperature?: number
  frequencyPenalty?: number
  presencePenalty?: number
  debug?: boolean
  debugapi?: boolean
  apiKey?: string
  filename?: string
  promptFolder?: string
}

// Prompt for a post based on a topic (automatic mode with no template)
export type AutoPostPrompt = BasePostPrompt & {
  topic?: string
  country?: string
  intent?: string
  audience?: string
  language: string
  generate?: boolean // generate the audience and intent
  withConclusion?: boolean

}

// Prompt for a post based on a template
export type TemplatePostPrompt = BasePostPrompt & {
  //  The template file (path to the file)
  templateFile: string

  // The input json used as inputs for the different sections/prompts in the template
  // This json is a key value pair where the key is of one template parameter
  input: any
}

export type TemplatePrompt = {
  // s = system, c = content, i = image
  type: 's' | 'c' | 'i'
  prompt: string
}

export type Heading = {
  title: string
  keywords?: string[]
  headings?: Heading[]
}

export type PostOutline = {
  title: string
  headings: Heading[]
  slug: string
  seoTitle: string
  seoDescription: string
}

export type Post = {
  h1: string
  content: string
  seoTitle: string
  seoDescription: string
  slug: string,
  categories?: number[],
  status?: string
}

export type TemplatePost = {
  h1: string
  content: string
  seoTitle: string
  seoDescription: string
  slug: string,
  categories?: number[],
  status?: string
}

export type SeoInfo = {
  h1: string
  slug: string
  seoTitle: string
  seoDescription: string
}

export type AudienceIntentInfo = {
  audience: string
  intent: string
}
