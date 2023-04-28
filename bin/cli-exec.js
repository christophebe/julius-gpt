#!/usr/bin/env node
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const cmd = 'node --no-warnings ' + dirname + '/cli.js ' + process.argv.slice(2).join(' ')
spawnSync(cmd, { stdio: 'inherit', shell: true, env: process.env })
