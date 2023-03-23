import { Command } from 'commander'
import { getAllWordpress, addWordpress, removeWordpress } from '../../lib/store/store'

export function buildWpCommands (program: Command) {
  const wpCommand = program
    .command('wp')
    .description('Wordpress related commands. The wp list is stored in the local store : ~/.julius/wordpress.json')
    .action(() => {
      console.log('Please provide a sub-command: "add" or "ls" or "rm" , ... ')
    })

  wpCommand
    .command('ls')
    .description('List all Wordpress posts')
    .action(async () => {
      await getAllWp()
    })

  wpCommand
    .command('add <domain:username:password>')
    .description('Add a new Wordpress site')
    .action(async (site) => {
      await addWpSite(site)
    })

  wpCommand
    .command('rm <domain|index>')
    .description('Remove Wordpress site')
    .action(async (domain) => {
      const deleted = await removeWordpress(domain)
      console.log(deleted ? `\nWordpress site ${domain} removed successfully\n` : `Wordpress site ${domain} not found\n`)
    })
}

async function getAllWp () {
  const wpSites = await getAllWordpress()
  if (wpSites.length === 0) {
    console.log('\nNo Wordpress site found\n')
    return
  }
  console.log('\nWordpress sites :\n')
  console.log(wpSites.map((wp, index) => `${index + 1}. ${wp.domain} (${wp.username})`).join('\n') + '\n')
}

async function addWpSite (site) {
  const [domain, username, password] = site.split(':')
  if (!domain || !username || !password) {
    console.error('Invalid Wordpress site format. Expected : domain:username:password')
    return
  }
  await addWordpress({ domain, username, password })
  console.log(`\nWordpress site ${domain} added successfully\n`)
}
