export type PostPrompt = {
  topic : string
  country : string
  intent : string
  audience : string
  language : string
  optionalh3 : boolean
  withConclusion : boolean
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
}

export type Post = {
  content : string
  title : string
  description : string
}
