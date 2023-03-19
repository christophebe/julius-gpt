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

export function init () {
  if (!fs.existsSync(hiddenDirPath)) {
    fs.mkdirSync(hiddenDirPath)
  }

  if (!fs.existsSync(WORDPRESS_FILE)) {
    fs.writeFileSync(WORDPRESS_FILE, '[]', 'utf8')
  }
}

export async function getAllWordpress () : Promise<Wordpress[]> {
  const data = await readFile(WORDPRESS_FILE, 'utf8')
  return JSON.parse(data)
}

export async function addWordpress (wp: Wordpress): Promise<void> {
  const wpSites = [...await getAllWordpress(), wp].sort((a, b) => a.domain.localeCompare(b.domain))
  await fs.promises.writeFile(WORDPRESS_FILE, JSON.stringify(wpSites), 'utf8')
}
