import fs from 'fs/promises'
import path from 'path'

export async function getSystemOutlineTemplate (templateFolder : string): Promise<string> {
  return await fs.readFile(path.join(templateFolder, 'system-outline.txt'), 'utf-8')
}

export async function getHumanOutlineTemplate (templateFolder : string): Promise<string> {
  return await fs.readFile(path.join(templateFolder, 'human-outline.txt'), 'utf-8')
}

export async function getIntroductionTemplate (templateFolder : string): Promise<string> {
  return await fs.readFile(path.join(templateFolder, 'introduction.txt'), 'utf-8')
}

export async function getConclusionTemplate (templateFolder : string): Promise<string> {
  return await fs.readFile(path.join(templateFolder, 'conclusion.txt'), 'utf-8')
}
