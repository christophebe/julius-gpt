This Node.js CLI and API gives you the ability to generate content with a LLM (OpenAI, ...). It can generate text in all languages supported by available LLMs.

This project is using [Langchain JS](https://js.langchain.com/docs/get_started/introduction)

# How it Works

This component can be used in different ways: 
- with the CLI ( interactive mode, automatic mode or with the help of a template).
- In your own application with the API. 

### Interactive / Automatic Mode

In **interactive mode**, the CLI will ask you for some parameters (topic/title, language, intent, audience, etc.). 

In **automatic mode**, you need to supply all the necessary parameters to the command line. This mode of operation allows you to create a multitude of contents in series (for example in a shell script).

Both modes will use different predefined prompts to generate the content:

- Generate the outline of the post (with the SEO description, SEO title, the slug).
- Generate the introduction.
- Generate the content of the different heading of the outline.
- Generate the conclusion.

The final result is in Markdown and HTML.


### Template

A template contains a document structure within a series of prompts. Each prompt will be executed in a specific order and will be replaced by the answer provided by the AI.
It is possible to use different formats: Markdown, HTML, JSON, etc.

The main advantage of the template usage is the customisation of the output. You can use your own prompts. Templates are also interesting if you want to produce different contents based on the same structure (product pages, landing pages, etc.).

### Completion Parameters

One of the problems of AI content generation is the repetition of the main keywords.
This script also uses `temperature`, `logit_bias`, `frequency_penalty`, and `presence_penalty` parameters to try to minimize this.
See the [OpenAI API documentation](https://platform.openai.com/docs/api-reference/completions) for more details.

### Publish on Wordpress

When generating, the CLI gives you the ability to publish the content to your WordPress blog.
Other CMS will be supported in the future. We need to support some headless CMS.

### Warning

**This is an experimental project. You are welcome to suggest improvements, like other prompts and other values for the parameters.**
**The cost of the API calls is not included in the price of the CLI. You need to have an OpenAI API key to use this CLI.**
**In all cases, you have to review the final output. AI can provide incorrect information.**

# Examples

## version 0.1.0 - Auto Mode

```bash
julius post -fp 1.5 -g -tp "5\ reasons\ to\ use\ AI\ for\ generating\ content" -f ./reasons-to-use-ai-content
```

Markdown result : [ 5 Reasons to Use AI for Generating Content](./examples/reasons-to-use-ai-content.md)


## version 0.1.0 - Template Markdown

```bash
julius template-post -f ./breed-dobermann  -t ./examples/template/dog-breed-template.md  -i breed=dobermann -d
```
Template : [ dog-breed-template](./examples/template/dog-breed-template.md)
Markdown result : [ dog-breed-template](./examples/template/breed-dobermann.md)

# Installation

The CLI and API are available as an npm package.

```bash
# for the API
npm install julius-gpt -S
# for the CLI
npm install -g julius-gpt
```

# CLI

The CLI has 3 groups of commands:

- post: generate a post in interactive or auto mode.
- template-post : generate a content based on a template. 
- wp: wordpress related commands : list, add, remove, update wp sites & publish posts.

```bash
~ julius -h   
Usage: julius [options] [command]

Generate and publish your content from the command line 🤯

Options:
  -V, --version   output the version number
  -h, --help      display help for a command

Commands:
  post [options]            Generate a post
  template-post [options]   Generate a post based on a content template
  wp                        Wordpress related commands. The wp list is stored in the local store : ~/.julius/wordpress.json
  help [command]            display help for command


```

## Generate a Post

**You need to have an OpenAI API key to use this CLI**.
You can specify your OpenAI API key with the `-k` option or with the environment variable `OPENAI_API_KEY`.

See the CLI help to get the list of the different options. 

```bash
 ~ julius post -h
```

### Automatic Mode 

```bash
 ~ julius post -tp "5 reasons to use AI for generating content"
```
Use the other parameters to personalize content even further.

**A more advanced command**
```bash
 ~ julius post -fp 1.5 -g -l french -tp "Emprunter\ avec\ un\ revenu\ de\ retraite\ :\ quelles\ sont\ les\ options\ \?" -f ./emprunter-argent-revenu-retraite -c Belgique -d
```
This command will generate a post in french with a frequency penaly of 1.5 for the audience of the country : Belgium. 
The topic (tp arg) is written in french. 

### Interactive Mode

```bash
 ~ julius post -i
```
It is not necessary to use the other parameters. The CLI will ask you some questions about the topic, language, ... 

### Generate Content Based on a Template

The template file can be in the markdown or HTML format. The template extension will be used to determine the final output.

```bash
 ~ julius template-post -t <file>.[md|html]
```

The CLI will execute all prompts mentioned in the template file. Each prompt shorts code will be replaced by the output provided by the AI.

**Template structure**

Here is a simple example for the template file:

```
{{0:Your are an prompt tester. You have to write your answers in a makrdown block code.}}
{{1:your answer has to be "Content of prompt 1."}}

# Heading 1
{{2:your answer has to be "Content of prompt 2."}}
```

Prompt 0 is the system prompt.
Prompt with number 1 and 2 will be replaced by the output provided by the AI.

**Like in Langchain, you can provide some input variables in the template like this one :**

```
{{0:Your are an prompt tester. You have to write your answers in a makrdown block code in language : {language}.}}
{{1:Quelle est la capitale de la France ?"}}

# Heading 1
{{2: Quelle est la capitale de la Belgique ? "}}
```

Now, you can execute this template with the following command : 

```bash
 ~ julius template-post -t <template-file>.md -i language=french
```


**This is an experimental feature and the template syntax will be modified in a upcoming release.**

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

This command create a new post on a Wordpress site.
the json file must have the following structure:

```json
{
    "title": "The title of the post",
    "slug": "the-slug-of-the-post",
    "content": "The content of the post",
    "seoTitle": "The SEO title of the post",
    "seoDescription": "The SEO description of the post",
}
```

This JSON file can be generated with the command `julius post` or with the API.

By default, the Wordpress REST API doesn't allow you to update the SEO title and description.
This information is managed by different plugins, such as Yoast SEO. You can code a plugin for this.

An plugin example for Yoast can be found in this directory: [julius-wp-plugin](./examples/julius-wp-plugin)
You can create a zip and install it from the Wordpress dashboard.

You can code something similar for other SEO plugins.

```bash
~ julius wp post www.domain.com|id categoryId post.json
```

- The first argument is the domain name or the id of the site.
- The second argument is the id of the category on this wordpress. you can get the list of categories with the command `julius wp categories www.domain.com|id`
- The third argument is a boolean to indicate if the wp used Yoast SEO plugin. If true, the SEO title and description will be published.
- The fourth argument is the path to the json file containing the post.

### update

This command update a post on a Wordpress site (title, content, SEO title & SEO description).
the json file must have the following structure:

```json
{
    "title": "The title of the post",
    "slug": "the-slug-of-the-post",
    "content": "The content of the post",
    "seoTitle": "The SEO title of the post",
    "seoDescription": "The SEO description of the post",
}
```

This JSON file can be generated with the command `julius post` or with the API.

```bash
~ julius wp update www.domain.com|id slug post.json [-d, --update-date] 
```

- The first argument is the domain name or the id of the site.
- The second argument is the slug of the post to update.
- The third argument is the json file.
- The fourth argument (optional) is to update the publication date or not.

# API

See the unit tests : tests/test-api.spec.ts

# Some Tools that can Help to Check Quality

- [Quillbot](https://try.quillbot.com/74enc3186nhg):  AI-powered paraphrasing tool will enhance your writing, grammar checker and plagiarism checker.
- [Originality](https://originality.ai?lmref=fJgVFg): AI Content Detector and Plagiarism Checker.

# TODO
- Support open source LLMs. 
- Customize the prompts for the interactive mode/auto mode : add new param in the CLI to specify the location of the prompt folder. 
- Generate images.


# Credit 

- [OpenAI API](https://openai.com/)
- [Langchain](https://js.langchain.com/docs/get_started/introduction)
