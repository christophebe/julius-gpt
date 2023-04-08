export type PostPrompt = {
  topic : string
  country : string
  intent : string
  audience : string
  language : string
  optionalh3 : boolean
  withConclusion : boolean
  temperature : number | 0.7
  frequencyPenalty : number | 0
  presencePenalty : number | 0
  logitBias : number | 0
}

export type Section = {
  title: string
  keywords?: string[]
  sections?: Section[]
}

export type PostOutline = {
  title: string
  sections : Section[]
}

export class PostOutlineValidationError extends Error {
  constructor (message: string, public readonly errors: any[]) {
    super(message)
  }
}

export class PostGeneratorOptions {
  debug : boolean = false
  apiKey? : string
  model? : string // OpenAI model :  gpt-4, gpt-3.5-turbo, ...
  maxModelTokens? : number
}

export type Post = {
  title : string // h1
  content : string
  seoTitle : string
  seoDescription : string
  slug : string,
  categories? : number[],
  status? : string
}

export type CompletionParams = {
  temperature?: number | null,
  top_p?: number | null,
  max_tokens?: number,
  presence_penalty?: number | null,
  frequency_penalty?: number | null,
  logit_bias?: object | null,
}
