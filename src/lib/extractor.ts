import JSON5 from 'json5'
import { validate } from 'jsonschema'

import { PostOutline } from '../types'

class PostOutlineValidationError extends Error {
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
    sections: {
      type: 'array',
      items: {
        $ref: '#/definitions/Section'
      }
    }
  },
  required: [
    'title',
    'sections'
  ],
  additionalProperties: false,
  definitions: {
    Section: {
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
        sections: {
          type: 'array',
          items: {
            $ref: '#/definitions/Section'
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

export function extractJsonCodeBlock (text : string) : string {
  // chatgpt returns the json block with the ```json or ``` markdown tag
  if (text.includes('```json')) {
    return text.match(/```json(.*)```/s)?.[1] ?? ''
  } else {
    if (text.includes('```')) {
      return text.match(/```(.*)```/s)?.[1] ?? ''
    } else {
      return text
    }
  }
}

export function extractHtmlCodeBlock (text : string) : string {
  // chatgpt returns the json block with the ```html or ``` markdown tag
  if (text.includes('```html')) {
    return text.match(/```html(.*)```/s)?.[1] ?? ''
  } else {
    if (text.includes('```')) {
      return text.match(/```(.*)```/s)?.[1] ?? ''
    } else {
      return text
    }
  }
}

export function extractPostOutlineFromCodeBlock (text: string) : PostOutline {
  // Use JSON5 because it supports trailing comma and comments in the json text
  const jsonData = JSON5.parse(extractJsonCodeBlock(text))
  const v = validate(jsonData, schemaValidiation)
  if (!v.valid) {
    const errorList = v.errors.map((val) => val.toString())
    throw new PostOutlineValidationError('Invalid json for the post outline', errorList)
  }
  return jsonData
}

export function extractJsonArray (text : string) : string[] {
  return JSON5.parse(extractJsonCodeBlock(text))
}
