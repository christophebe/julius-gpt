import { TemplatePostPrompt, TemplatePrompt } from 'src/types'

export class Template {
  private prompts: TemplatePrompt[] = []

  constructor (private template: string) {
    this.prompts = this.extractPrompts(template)
  }

  public getSystemPrompt (): string {
    const sysPrompts = this.prompts.filter(prompt => prompt.type === 's')
    if (sysPrompts.length > 0) {
      return sysPrompts[0].prompt
    }
    return ''
  }

  public getPrompts (): TemplatePrompt[] {
    return this.prompts.filter(prompt => prompt.type !== 's')
  }

  public buildContent (contents: string[]): string {
    const content = this.removeSystemPrompt(this.template)
    return this.replaceAllContentPrompts(content, contents)
  }

  private extractPrompts (template: string): TemplatePrompt[] {
    const regex = /{{(s|c|i):([\s\S]*?)}}/g
    const matches = Array.from(template.matchAll(regex))
    return matches.map(match => ({
      type: match[1].trim() as 's' | 'c' | 'i',
      prompt: match[2].trim()
    }))
  }

  private removeSystemPrompt (template: string): string {
    const regex = /{{s:[\s\S]*?}}/g
    return template.replace(regex, '')
  }

  private replaceAllContentPrompts (template: string, contents: string[]): string {
    let result = template
    contents.forEach(content => {
      const regex = /{{c:[\s\S]*?}}/
      result = result.replace(regex, content)
    })
    return result
  }
}

export function isHTML (prompt: TemplatePostPrompt) {
  return getFileExtension(prompt) === 'html'
}

export function isMarkdown (prompt: TemplatePostPrompt) {
  return getFileExtension(prompt) === 'md'
}

export function getFileExtension (prompt: TemplatePostPrompt) {
  return prompt.templateFile.split('.').pop()
}
