#!/usr/bin/env node
import * as dotenv from 'dotenv'
import { Command } from 'commander'
import { buildWpCommands } from './command/wp'
import { buildPostCommands } from './command/post'
import { init as initStore } from '../lib/store/store'
import pk from '../../package.json' assert { type: 'json' }

dotenv.config()

export async function main () {
  initStore()

  const program = new Command()
  program
    .name('julius')
    .version(pk.version)
    .description('Generate and publish your content from the command line 🤯')

  buildPostCommands(program)
  buildWpCommands(program)
  program.parse()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
