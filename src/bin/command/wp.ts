import fs from 'fs'
import util from 'util'
import { Command } from 'commander'
import {
  getAllWordpress,
  getWordpress,
  addWordpress,
  removeWordpress,
  exportWordpressList,
  importWordpressList
} from '../../lib/store/store'

import { getCategories, createPost, updatePost } from '../../lib/wp/wp-api'
import { Post } from '../../types'

const readFile = util.promisify(fs.readFile)

type UpdateOptions = {
  date : string
}

export function buildWpCommands (program: Command) {
  const wpCommand = program
    .command('wp')
    .description('Wordpress related commands. The wp list is stored in the local store : ~/.julius/wordpress.json')
    .action(() => {
      console.log('Please provide a sub-command: "add" or "ls" or "rm" , ... ')
    })

  wpCommand
    .command('ls')
    .description('List all Wordpress sites')
    .action(async () => {
      await getAllWp()
    })

  wpCommand
    .command('info <domain|index>')
    .description('Info on a Wordpress site')
    .action(async (domain) => {
      const domainFound = await getWordpress(domain)
      if (domainFound) {
        console.log('\nWordpress site found :\n')
        console.log(`\ndomain : ${domainFound.domain}`)
        console.log(`username : ${domainFound.username}`)
        console.log(`password : ${domainFound.password}\n`)
      } else {
        console.log(`\nWordpress site ${domain} not found\n`)
      }
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

  wpCommand
    .command('export <file>')
    .description('Export the list of wordpress sites (with credentials) the console')
    .action(async (file) => {
      await exportWordpressList(file)
    })

  wpCommand
    .command('import <file>')
    .description('Import the list of wordpress sites (with credentials) from a file')
    .action(async (file) => {
      await importWordpressList(file)
    })

  wpCommand
    .command('categories <domain|index>')
    .description('Fetch the categories for one Wordpress site')
    .action(async (domain) => {
      const domainFound = await getWordpress(domain)
      if (domainFound) {
        const categories = await getCategories(domainFound)
        console.log(categories)
      } else {
        console.log(`\nWordpress site ${domain} not found\n`)
      }
    })

  wpCommand
    .command('post <domain> <categoryId> <jsonfile>')
    .description('Create a new post to a Wordpress site. The file has to be a json file containing : { content, categories, seoTitle, seoDescription }')
    .action(async (domain, categoryId, jsonFile) => {
      const domainFound = await getWordpress(domain)
      if (!domainFound) {
        console.log(`\nWordpress site ${domain} not found\n`)
        return
      }
      const jsonContent = await readFile(jsonFile, 'utf8')
      const post: Post = JSON.parse(jsonContent)
      post.categories = [categoryId]
      post.status = 'draft'

      await createPost(domainFound, post)
      console.log(`\nContent has been published on https://${domainFound.domain}/${post.slug}\n`)
    })

  wpCommand
    .command('update <domain> <slug> <jsonfile>')
    .option('-d, --date <date>', 'Update the publish date of the post. Use the format YYYY-MM-DD:HH:MM:SS')
    .description('Update a new post to a Wordpress site. The file has to be a json file containing : { content, seoTitle, seoDescription }')
    .action(async (domain, slug, jsonFile, options : UpdateOptions) => {
      const domainFound = await getWordpress(domain)
      if (!domainFound) {
        console.log(`\nWordpress site ${domain} not found\n`)
        return
      }
      const jsonContent = await readFile(jsonFile, 'utf8')
      const newContent: Post = JSON.parse(jsonContent)
      await updatePost(domainFound, slug, newContent, options.date)
      console.log(`\nContent has been updated on https://${domainFound.domain}${slug}\n\n`)
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
    console.error('Invalid format for adding a new wp site. Expected : domain:username:password')
    return
  }
  await addWordpress({ domain, username, password })
  console.log(`\nWordpress site ${domain} added successfully\n`)
}
