import path from 'path'
import * as fs from 'fs/promises'
import { Command } from 'commander'

const DEFAULT_PROMPT_FOLDER = './prompts'

export function buildPromptCommands (program: Command) {
  const promptCommand = program
    .command('prompt')
    .description('Prompt related commands')
    .action(() => {
      console.log('Please use julius prompt <sub-command> to use the prompt commands or julius prompt --help')
    })

  promptCommand
    .command('create <name> <folder>')
    .description('Create custom prompts called name inside a folder')
    .action(async (name, folder) => {
      await createPrompts(name, folder)
    })
}

async function createPrompts (name : string, folder : string) {
  const defaultPromptFolder = path.join(__dirname, DEFAULT_PROMPT_FOLDER)
  // console.log(`${defaultPromptFolder}`)
  await copyFiles(defaultPromptFolder, `${folder}/${name}`)
  console.log(`\nNew prompt set "${name}" created in the folder : ${folder}/${name}\n`)
}

async function copyFiles (fromPath: string, toPath: string) {
  try {
    const files = await fs.readdir(fromPath)

    await fs.mkdir(toPath, { recursive: true })

    const copyPromises = files.map(async file => {
      const fromFilePath = path.join(fromPath, file)
      const toFilePath = path.join(toPath, file)

      await fs.copyFile(fromFilePath, toFilePath)
      console.log(`Copied ${file} from ${fromPath} to ${toPath}`)
    })

    await Promise.all(copyPromises)
  } catch (err) {
    console.error(`Error copying files: ${err}`)
  }
}
