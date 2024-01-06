import fs from 'fs/promises'
import path from 'path'

export async function getSystemOutlineTemplate (): Promise<string> {
  return await fs.readFile(path.join(__dirname, 'system-outline.txt'), 'utf-8')
}

export async function getHumanOutlineTemplate (): Promise<string> {
  return await fs.readFile(path.join(__dirname, 'human-outline.txt'), 'utf-8')
}

// OLD FUNCTIONS
// export function extractPrompts (template: string): string[] {
//   const regex = /{\d+:((?:.|\n)*?)}/g
//   return Array.from(template.matchAll(regex)).map((match) => match[1].trim())
// }

// export function replacePrompt (template: string, index: number, content: string): string {
//   const regex = new RegExp(`{${index}:((?:.|\n)*?)}`)
//   return template.replace(regex, content)
// }

// export function replaceAllPrompts (template: string, contents: string[]): string {
//   // We are removing the first prompt because it is the system prompt
//   let tmpTemplate = replacePrompt(template, 0, '')

//   contents.forEach((content, index) => {
//     tmpTemplate = replacePrompt(tmpTemplate, index + 1, content)
//   })

//   return tmpTemplate.trim()
// }
