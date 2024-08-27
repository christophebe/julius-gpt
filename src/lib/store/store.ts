import os from 'os'
import fs from 'fs'
import path from 'path'
import util from 'util'
import { Wordpress } from './types'
const readFile = util.promisify(fs.readFile)

const userHomeDir = os.homedir()

const HIDDEN_DIR_NAME = '.julius'
const hiddenDirPath = path.join(userHomeDir, HIDDEN_DIR_NAME)

const WORDPRESS_FILE = `${hiddenDirPath}/wordpress.json`

export function initStore() {
  if (!fs.existsSync(hiddenDirPath)) {
    fs.mkdirSync(hiddenDirPath)
  }

  if (!fs.existsSync(WORDPRESS_FILE)) {
    fs.writeFileSync(WORDPRESS_FILE, '[]', 'utf8')
  }
}

export async function getAllWordpress(): Promise<Wordpress[]> {
  const data = await readFile(WORDPRESS_FILE, 'utf8')
  return JSON.parse(data)
}

export async function addWordpress(wp: Wordpress): Promise<void> {
  const wpSites = [...await getAllWordpress(), wp].sort((a, b) => a.domain.localeCompare(b.domain))
  await fs.promises.writeFile(WORDPRESS_FILE, JSON.stringify(wpSites), 'utf8')
}

export async function getWordpress(domain: string): Promise<Wordpress | undefined> {
  const wpSites = await getAllWordpress()
  const index = !isNaN(Number(domain)) ? Number(domain) - 1 : wpSites.findIndex((wp) => wp.domain === domain)
  return wpSites[index]
}

export async function removeWordpress(domain: string): Promise<boolean> {
  const wpSites = await getAllWordpress()
  const index = !isNaN(Number(domain)) ? Number(domain) - 1 : wpSites.findIndex((wp) => wp.domain === domain)

  if (index < 0) {
    return false
  }
  wpSites.splice(index, 1)
  await fs.promises.writeFile(WORDPRESS_FILE, JSON.stringify(wpSites), 'utf8')
  return true
}

export async function exportWordpressList(exportFile: string) {
  await fs.promises.copyFile(WORDPRESS_FILE, exportFile)
}

export async function importWordpressList(importFile: string) {
  const data = await readFile(importFile, 'utf8')
  const wpSites = JSON.parse(data)
  await fs.promises.writeFile(WORDPRESS_FILE, JSON.stringify(wpSites), 'utf8')
}
