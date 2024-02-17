export type BasePostPrompt = {
  model: 'gpt-4-turbo-preview' | 'gpt-4' | 'gpt-3.5-turbo'
  temperature?: number
  frequencyPenalty?: number
  presencePenalty?: number
  logitBias?: number
  debug?: boolean
  debugapi?: boolean
  apiKey?: string
  filename?: string
  promptFolder?: string
}
export type AutoPostPrompt = BasePostPrompt & {
  topic? : string
  country? : string
  intent? : string
  audience? : string
  language: string
  generate? : boolean // generate the audience and intent
  withConclusion? : boolean

}

export type TemplatePostPrompt = BasePostPrompt & {
  // filename?: string
  templateFile: string
  input : any
}

export type Heading = {
  title: string
  keywords?: string[]
  headings?: Heading[]
}

export type PostOutline = {
  title: string
  headings : Heading[]
  slug : string
  seoTitle : string
  seoDescription : string
}

export type Post = {
  h1 : string
  content : string
  seoTitle : string
  seoDescription : string
  slug : string,
  categories? : number[],
  status? : string
}

export type TemplatePost = {
  h1 : string
  content : string
  seoTitle : string
  seoDescription : string
  slug : string,
  categories? : number[],
  status? : string
}

export type SeoInfo = {
  h1 : string
  slug : string
  seoTitle : string
  seoDescription : string
}

export type AudienceIntentInfo = {
  audience : string
  intent : string
}
