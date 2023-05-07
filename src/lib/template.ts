
export function extractPrompts (template: string): string[] {
  const regex = /{\d+:((?:.|\n)*?)}/g
  return Array.from(template.matchAll(regex)).map((match) => match[1].trim())
}

export function replacePrompt (template: string, index: number, content: string): string {
  const regex = new RegExp(`{${index}:((?:.|\n)*?)}`)
  return template.replace(regex, content)
}
