import JSON5 from 'json5'
import { validate } from 'jsonschema'

import { AudienceIntentInfo, PostOutline, SeoInfo } from '../types'

export class PostOutlineValidationError extends Error {
  constructor (message: string, public readonly errors: any[]) {
    super(message)
  }
}

const schemaValidiation = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    title: {
      type: 'string'
    },
    headings: {
      type: 'array',
      items: {
        $ref: '#/definitions/Heading'
      }
    },
    slug: {
      type: 'string'
    },
    seoTitle: {
      type: 'string'
    },
    seoDescription: {
      type: 'string'
    }
  },
  required: [
    'title',
    'headings',
    'slug',
    'seoTitle',
    'seoDescription'
  ],
  additionalProperties: false,
  definitions: {
    Heading: {
      type: 'object',
      properties: {
        title: {
          type: 'string'
        },
        keywords: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        headings: {
          type: 'array',
          items: {
            $ref: '#/definitions/Heading'
          }
        }
      },
      required: [
        'title'
      ],
      additionalProperties: false
    }
  }
}

export function extractCodeBlock (text: string): string {
  // Extract code blocks with specified tags
  const codeBlockTags = ['markdown', 'html', 'json']

  for (const tag of codeBlockTags) {
    const regex = new RegExp(`\`\`\`${tag}((.|\\n|\\r)*?)\`\`\``, 'i')
    const match = text.match(regex)
    if (match) {
      return match[1]
    }
  }

  // Extract code blocks without specified tags
  const genericRegex = /```\n?((.|\\n|\\r)*?)```/
  const genericMatch = text.match(genericRegex)
  if (genericMatch) {
    return genericMatch[1]
  }

  // No code blocks found
  return text
}

export function extractPostOutlineFromCodeBlock (text: string) : PostOutline {
  // Use JSON5 because it supports trailing comma and comments in the json text
  const jsonData = JSON5.parse(extractCodeBlock(text))
  const v = validate(jsonData, schemaValidiation)
  if (!v.valid) {
    const errorList = v.errors.map((val) => val.toString())
    throw new PostOutlineValidationError('Invalid json for the post outline', errorList)
  }
  return jsonData
}

export function extractJsonArray (text : string) : string[] {
  return JSON5.parse(extractCodeBlock(text))
}

export function extractSeoInfo (text : string) : SeoInfo {
  return JSON5.parse(extractCodeBlock(text))
}

export function extractAudienceIntentInfo (text : string) : AudienceIntentInfo {
  return JSON5.parse(extractCodeBlock(text))
}
