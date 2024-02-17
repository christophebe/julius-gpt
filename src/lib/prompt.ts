import fs from 'fs/promises'
import path from 'path'

// ---------------------------------------------------------------------------
// Auto mode
// ---------------------------------------------------------------------------
export async function getSystemPrompt (promptFolder : string): Promise<string> {
  return await fs.readFile(path.join(promptFolder, 'system.txt'), 'utf-8')
}

export async function getOutlinePrompt (promptFolder : string): Promise<string> {
  return await fs.readFile(path.join(promptFolder, 'outline.txt'), 'utf-8')
}

export async function getAudienceIntentPrompt (promptFolder : string): Promise<string> {
  return await fs.readFile(path.join(promptFolder, 'audience-intent.txt'), 'utf-8')
}

export async function getIntroductionPrompt (promptFolder : string): Promise<string> {
  return await fs.readFile(path.join(promptFolder, 'introduction.txt'), 'utf-8')
}

export async function getConclusionPrompt (promptFolder : string): Promise<string> {
  return await fs.readFile(path.join(promptFolder, 'conclusion.txt'), 'utf-8')
}

export async function getHeadingPrompt (promptFolder : string): Promise<string> {
  return await fs.readFile(path.join(promptFolder, 'heading.txt'), 'utf-8')
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------
export async function getSeoInfoPrompt (promptFolder: string): Promise<string> {
  return await fs.readFile(path.join(promptFolder, 'seo.txt'), 'utf-8')
}
