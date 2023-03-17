# Intro 
This nodejs CLI and API gives you the ability to generate content with the help of OpenAI API (GPT-4). 

It used a series of prompts to generate content : 
- Ask to write like a human (why not ? - just to be sure ;-) )
- Generate the outline of the post
- Generate the introduction
- Generate the different sections of the outline
- Generate the conclusion
- Generate the SEO title and description

# Installation

CLI and API are available as a npm package.


```bash
npm install -g  julius-gpt
```
# CLI

```bash
Usage: julius [options] [command]

Options:
  -V, --version  output the version number
  -h, --help     display help for command
  -k, --key      Set yourOpenAI API key
  -d, --debug    Display debug information

  You can also create a .env file in the root of your project and add the following line:
    OPENAI_API_KEY=YOUR_API_KEY
```
note: command is not yet required. You just need to set the options. Other commands will be added in the future.

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
// Ppost is an object with the following properties
// post.content
// post.title
// post.description

```

# TODO
- Personnalize the prompts
- Personnalize the post outline
- Generate images 
- Publish content on wordpress and other CMS
- Massively generate content