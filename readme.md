# Intro 
This nodejs CLI and API gives you the ability to generate content with the help of OpenAI API (GPT-4). 

It used a series of prompts to generate content : 
- Ask to write like a human (why not ? - just to be sure ;-) )
- Generate the outline of the post
- Generate the introduction
- Generate the content of the different sections of the outline
- Generate the conclusion
- Generate the SEO title and description


When generating, the CLI gives you the ability to publish the content on your wordpress blog.
Other CMS will be supported in the future. We need to support some headless CMS.

# Installation

CLI and API are available as a npm package.


```bash
# for the API
npm install julius-gpt -S
# for the CLI
npm install -g julius-gpt
```

# CLI
The CLI has 2 groups of commands :
- post : generate a post
- wp : wordpress related commands : list, add, remove, update wp sites & publish posts 


```bash
~ julius -h   
Usage: julius [options] [command]

Generate and publish your content from the command line 🤯

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  post [options]  Generate a post
  wp              Wordpress related commands. The wp list is stored in the local store : ~/.julius/wordpress.json
  help [command]  display help for command


```
## Generate a post
Generate a post with the help of OpenAI API (by default GPT-4). It is generated with a series of prompts. The prompts are used to generate the outline, the introduction, the content of the different sections of the outline, the conclusion, the SEO title and description.
The slug (url) is also generated. 

**You need to have an OpenAI API key to use this CLI**
You can specify the API key with the `-k` option or with the environment variable `OPENAI_API_KEY`.


```bash
 ~ julius post -h
Usage: julius post [options]

Generate a post

Options:
  -d, --debug           output extra debugging
  -k, --apiKey <key>    set the OpenAI api key. use only for the wp post command
  -m, --model <model>   set the OpenAI model : gpt-4, gpt-3.5-turbo, gpt-3, ...(default : gpt-4)
  -t, --tokens <token>  Number of tokens to generate (default : 8100)
  -h, --help            display help for command
```

The CLI will ask you some questions to generate the post :
- title/topic
- country (optional)
- intent (optional)
- audience (optional)
- language : we support all languages supported by GPT-4
- optional h3 : if true, the generated content will contain some h3
- with conclusion : if true, the generated content will contain a conclusion



## Wordpress related commands

### list
This command displays the list of all registered Wordpress sites in the local file ~/.julius/wordpress.json. 

**The domain name or the id of the site can be used for the following commands.**

```bash
~ julius wp ls
```

### add
This command adds a new Wordpress site to the local file ~/.julius/wordpress.json.

```bash
~ julius wp add www.domain.com:username:password
```

### info

This command displays the list of all registered Wordpress sites in the local file ~/.julius/wordpress.json.

```bash
~ julius wp info www.domain.com|id
```
### rm

This command removes a Wordpress site from the local file ~/.julius/wordpress.json.

```bash
~ julius wp rm www.domain.com|id
```

### export

This command exports the list of all registered Wordpress sites in the local file ~/.julius/wordpress.json.

```bash
~ julius wp export wordpress_sites.json
```

### import

This command imports the list of all registered Wordpress sites in the local file ~/.julius/wordpress.json.

```bash
~ julius wp import wordpress_sites.json
```

### categories

This command displays the list of all categories of a Wordpress site.

```bash
~ julius wp categories www.domain.com|id
```
### post



This command publishes a post on a Wordpress site.
the json file must have the following structure : 
```json
{
    "title": "The title of the post",
    "slug": "the-slug-of-the-post",
    "content": "The content of the post",
    "seoTitle": "The SEO title of the post",
    "seoDescription": "The SEO description of the post",
}
```

This json file can be generated with the command `julius post` or with the API.

```bash
~ julius wp post www.domain.com|id categoryId true post.json
```

- The first argument is the domain name or the id of the site.
- The second argument is the id of the category on this word. you can get the list of categories with the command `julius wp categories www.domain.com|id`
- The third argument is a boolean to indicate if the wp used Yoast SEO plugin. If true, the SEO title and description will be published.
- The fourth argument is the path to the json file containing the post.




# API

```js
import { ChatGptPostGenerator } from julius-gpt

const prompt = {
    topic: 'How to generate content with GPT-4 ?',
    country: 'USA - not mandatory',
    intent: 'Explains the intent - not mandatory',
    audience: 'describe your audience - not mandatory',
    language: 'english', // could be any language supported by GPT-4
    optionalh3: true, // optional h3 in the content. 
    withConclusion: true
}

// optional options
const options = {
    debug: true, // display debug information
    apiKey : 'YOUR_API_KEY', // if you don't want to use the .env file
}

const postGenerator = new ChatGptPostGenerator(prompt, options)
const post = await postGenerator.generate()
// Post is an object with the following properties :
// post.title
// post.content
// post.seoDescription
// post.seoTitle
// post.slug

```

# TODO
- Personnalize the prompts
- Personnalize the post outline
- Generate images 
- Publish content on wordpress and other CMS
- Massively generate content

# Credit 
- [OpenAI API](https://openai.com/) 
- [Travis Fisher](https://transitivebullsh.it/) for his excellent [NodeJS client for OpenAI](https://github.com/transitive-bullshit/chatgpt-api)