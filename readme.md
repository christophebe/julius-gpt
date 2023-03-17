# Intro 
This nodejs CLI and API gives you the ability to generate content with the help of OpenAI API (GPT-4). 
It used a series of prompts to generate content. 

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

  You can also create a .env file in the root of your project and add the following line:
    OPENAI_API_KEY=YOUR_API_KEY
```


# API

```js
import { ChatGptPostGenerator } from julius-gpt

const prompt = {
    topic: 'How to generate content with GPT-4 ?',
    country: 'USA - not mandatory',
    intent: 'this is the intent - add more details - not mandatory',
    audience: 'describe your audience - not mandatory',
    language: 'en',
    optionalh3: true,
    withConclusion: true
}
const postGenerator = new ChatGptPostGenerator(prompt, options)
const post = await postGenerator.generate()

```

# TODO
- Personnalize the prompts
- Personnalize the post outline
- Generate images 
- Publish content on wordpress and other CMS
- Massively generate content