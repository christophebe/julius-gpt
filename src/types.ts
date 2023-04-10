
export type PostPrompt = {
  topic : string
  country : string
  intent : string
  audience : string
  language : string
  optionalh3 : boolean
  withConclusion : boolean
  model : 'gpt-4' | 'gpt-3.5-turbo'
  maxModelTokens : 8000 | 4000
  temperature : number | 0.7
  frequencyPenalty : number | 0
  presencePenalty : number | 0
  logitBias : number | 0
  debug : boolean | false
  debugapi : boolean | false
  apiKey? : string
  filename : string
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

export type Post = {
  title : string // h1
  content : string
  seoTitle : string
  seoDescription : string
  slug : string,
  categories? : number[],
  status? : string
}
