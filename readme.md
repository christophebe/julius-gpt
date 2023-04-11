# Intro 
This nodejs CLI and API gives you the ability to generate content with the OpenAI API (GPT-4 by default). 

# How it works ?

It uses a series of prompts to generate content : 
- Generate the outline of the post
- Generate the introduction
- Generate the content of the different sections of the outline
- Generate the conclusion
- Generate the SEO title and description
- Generate the slug (url)

One of the problems of AI content generation is the repetition of the main keywords. 
This script also uses the temperature, logit_bias, frequency penalty, presence penalty parameters to try to minimize this. 
See the [OpenAI API documentation](https://platform.openai.com/docs/api-reference/completions) for more details.

**This is an experimental project. You are welcome to suggest improvements, like other prompts and other values for the parameters.**

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

**You need to have an OpenAI API key to use this CLI**
You can specify the API key with the `-k` option or with the environment variable `OPENAI_API_KEY`.

```bash
 ~ julius post -h
Usage: julius post [options]

Generate a post

Options:
  -d, --debug           output extra debugging
  -da, --debugapi       debug the api calls
  -k, --apiKey <key>    set the OpenAI api key. use only for the wp post command
  -h, --help            display help for command
```

The CLI will ask you some questions to generate the post :
- language : we support all languages supported by GPT-4
- model : GPT-4 or GPT-3.5-turbo
- filename : the cli generate an html & json file with the content of the post based on the filename. The json file can be used to publish the post on a Wordpress site.
- title/topic
- country (optional)
- intent (optional)
- audience (optional)
- with conclusion : if true, the generated content will contain a conclusion
- temperature (optional)
- Frequency Penalty (optional)
- Presence Penalty (optional)
- Logit bias (optional)


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
import { OpenAIPostGenerator } from julius-gpt

const prompt = {
    topic: 'How to generate content with GPT-4 ?',
    country: 'USA', // optional
    intent: 'Explains the intent', // optional
    audience: 'describe your audience', // optional
    language: 'english', // could be any language supported by GPT-4 
    withConclusion: true, 
    temperature: 0.7, // optional
    frequencyPenalty: -0.5, // optional
    presencePenalty: 0.5, // optional
    logitBias: -1, // optional
}

// options
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
- custom prompts
- Personalize the post outline
- Generate images 
- Publish content on wordpress and other CMS
- Massively generate content

# Credit 
- [OpenAI API](https://openai.com/) 
- [Travis Fisher](https://transitivebullsh.it/) for his excellent [NodeJS client for OpenAI](https://github.com/transitive-bullshit/chatgpt-api)