export type TotalTokens = {
  promptTokens: number,
  completionTokens: number,
  total : number
}

export type PostPrompt = {
  topic : string
  country : string
  intent : string
  audience : string
  language : string
  withConclusion : boolean
  model : 'gpt-4' | 'gpt-3.5-turbo',
  maxModelTokens : 4000 | 8000,
  temperature : number | 0.7
  frequencyPenalty : number | 0
  presencePenalty : number | 0
  logitBias : number | 0
  debug : boolean | false
  debugapi : boolean | false
  apiKey? : string
  filename : string
}

export type Heading = {
  title: string
  keywords?: string[]
  headings?: Heading[]
}

export type PostOutline = {
  title: string
  headings : Heading[]
}

export type Post = {
  title : string
  content : string
  seoTitle : string
  seoDescription : string
  slug : string,
  categories? : number[],
  status? : string,
  totalTokens : TotalTokens
}
