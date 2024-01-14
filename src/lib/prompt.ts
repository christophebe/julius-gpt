import fs from 'fs/promises'
import path from 'path'

export async function getSystemOutlineTemplate (promptFolder : string): Promise<string> {
  return await fs.readFile(path.join(promptFolder, 'system.txt'), 'utf-8')
}

export async function getHumanOutlineTemplate (promptFolder : string): Promise<string> {
  return await fs.readFile(path.join(promptFolder, 'outline.txt'), 'utf-8')
}

export async function getIntroductionTemplate (promptFolder : string): Promise<string> {
  return await fs.readFile(path.join(promptFolder, 'introduction.txt'), 'utf-8')
}

export async function getConclusionTemplate (promptFolder : string): Promise<string> {
  return await fs.readFile(path.join(promptFolder, 'conclusion.txt'), 'utf-8')
}

export async function getHeadingTemplate (promptFolder : string): Promise<string> {
  return await fs.readFile(path.join(promptFolder, 'heading.txt'), 'utf-8')
}
