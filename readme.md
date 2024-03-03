This Node.js CLI and API gives you the ability to generate content (blog post, landing pages, ...) with a LLM (OpenAI, ...). It can generate text in all languages supported by the available LLMs.

This project is using [Langchain JS](https://js.langchain.com/docs/get_started/introduction)

# Features

🔄 Different modes for generating content: automatic, interactive, or with a content template.

🧠 Supported LLMs : OpenAI (stable), Mistral (experimental), Claude (upcoming release), Groq (upcoming release).

🌍 All languages supported by the available LLMs.

🔥 SEO friendly : generate post title, description & slug. 

✍️ Default or custom prompts.

⚙️ Fine-tuning with completion parameters.

📝 Publish content on WordPress.

🌐 API.

🔜 Upcoming features: image generations, RAG, publish on NextJS.


# Table of Content


- [How it Works](#how-it-works)
  - [Interactive / Automatic Mode](#interactive--automatic-mode)
  - [Template Mode](#template-mode)
  - [Completion Parameters](#completion-parameters)
  - [Publish on WordPress](#publish-on-wordpress)
- [Warning](#warning)
- [Examples](#examples)
  - [Auto mode with custom prompts in French](#auto-mode-with-custom-prompts-in-french)
  - [Auto Mode](#auto-mode)
  - [Template Markdown](#template-markdown)
  - [Template HTML](#template-html)
- [Installation](#installation)
- [CLI](#cli)
  - [Generate a Post](#generate-a-post)
    - [Automatic Mode](#automatic-mode)
    - [Interactive Mode](#interactive-mode)
    - [Generate Content Based on a Template](#generate-content-based-on-a-template)
  - [Custom prompts](#custom-prompts)
    - [Default prompts](#default-prompts)
    - [Create a custom prompt](#create-a-custom-prompt)
- [WordPress related commands](#wordpress-related-commands)
  - [List](#list)
  - [Add](#add)
  - [Info](#info)
  - [Remove](#rm)
  - [Export](#export)
  - [Import](#import)
  - [Categories](#categories)
  - [Post](#post)
  - [Update](#update)
- [API](#api)
- [Some Tools that can Help to Check Quality](#some-tools-that-can-help-to-check-quality)
- [Credit](#credit)



# How it Works ?

This component can be used in different modes: 
- with the CLI ( interactive mode, automatic mode or with the help of a template).
- In your application with the API. 

## 1. Interactive / Automatic Mode

In **interactive mode**, the CLI will ask you for some parameters (topic/title, language, intent, audience, etc.). 

In **automatic mode**, you need to supply all the necessary parameters to the command line. This mode of operation allows you to create a multitude of contents in series (for example, in a shell script).

Both modes will use different predefined prompts to generate the content:

- Generate the outline of the post (with the SEO description, SEO title, the slug).
- Generate the introduction.
- Generate the content of the different heading of the outline.
- Generate the conclusion.

The final result is in Markdown and HTML.

## 2. Template Mode

A template contains a document structure within a series of prompts. Each prompt will be executed in a specific order and will be replaced by the answer provided by the AI.
It is possible to use different formats: Markdown, HTML, JSON, etc.

The main advantage of the template usage is the customisation of the output. You can use your own prompts. Templates are also interesting if you want to produce different contents based on the same structure (product pages, landing pages, etc.).

## 3. Completion Parameters

One of the problems of AI content generation is the repetition of the main keywords.
This script also uses `temperature`, `logit_bias`, `frequency_penalty`, and `presence_penalty` parameters to try to minimize this.
See the [OpenAI API documentation](https://platform.openai.com/docs/api-reference/completions) for more details.

## 4. Publish on Wordpress

When generating, the CLI gives you the ability to publish the content to your WordPress blog.
Other CMS will be supported in the future. We need to support some headless CMS.

## Warning

**This is an experimental project. You are welcome to suggest improvements, like other prompts and other values for the parameters.**
**The cost of the API calls is not included in the price of the CLI. You need to have an OpenAI API key to use this CLI.**
**In all cases, you have to review the final output. AI can provide incorrect information.**

# Examples

## version 0.1.1 - Auto mode with custom prompts in french

[Camping-cars écologiques ? Utopie ou réalité en 2024 ?](./examples/cc-eco4.md)

## version 0.1.0 - Auto Mode

```bash
julius post -fp 1.5 -g -tp "5\ reasons\ to\ use\ AI\ for\ generating\ content" -f ./reasons-to-use-ai-content
```

Markdown result : [ 5 Reasons to Use AI for Generating Content](./examples/reasons-to-use-ai-content.md)


## version 0.1.1 - Template Markdown

```bash
julius template-post -f ./dobermann  -t ./template.md  -i breed=dobermann -d
```
Template : [template.md](./examples/markdown/template.md?plain=1)

Markdown result : [dobermann.md](./examples/markdown/dobermann.md)

## version 0.1.1 - Template HTML

```bash
julius template-post -f ./dobermann  -t ./template.html  -i breed=dobermann -d
```
Template : [template.html](./examples/html/template.html?plain=1)

HTML result : [dobermann.html](./examples/html/dobermann.html)

# Installation

The CLI and API are available as a NPM package.

```bash
# for the API
npm install julius-gpt -S
# for the CLI
npm install -g julius-gpt
```

# CLI

The CLI has 4 groups of commands:
- prompt : custom prompt management.
- post: generate a post in interactive or auto mode.
- template-post : generate a content based on a template. 
- wp: wordpress related commands : list, add, remove, update WP sites & publish posts.


```bash
~ julius -h                      
Usage: julius [options] [command]

Generate and publish your content from the command line 🤯

Options:
  -V, --version            output the version number
  -h, --help               display help for command

Commands:
  prompt                   Prompt related commands
  post [options]           Generate a post in interactive or automatic mode
  template-post [options]  Generate a post based on a content template
  wp                       Wordpress related commands. The 


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
This command will generate a post in French with a frequency penalty of 1.5 for the audience of the country : Belgium. 
The topic (tp arg) is written in French. 

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

The CLI will execute all prompts mentioned in the template file. Each prompt short-code will be replaced by the output provided by the AI.

**Template structure**

Here is a simple example for the template file:

```
{{s:Your are an prompt tester. You have to write your answers in a makrdown block code.}}
{{c:your answer has to be "Content of prompt 1."}}

# Heading 1
{{c:your answer has to be "Content of prompt 2."}}
```

Prompt "s" is the system prompt
Prompt with "c" are content prompt. they will be replaced by the output provided by the AI.

**Like in Langchain, you can provide some input variables in the template like this one :**

```
{{s:Your are an prompt tester. You have to write your answers in a makrdown block code in language : {language}.}}
{{c:Quelle est la capitale de la France ?"}}

# Heading 1
{{c: Quelle est la capitale de la Belgique ? "}}
```

Now, you can execute this template with the following command : 

```bash
 ~ julius template-post -t <template-file>.md -i language=french
```


**This is an experimental feature and the template syntax will be modified in a upcoming release.**

## Supported Models 

By default, the CLI is using the latest open ai model. We are working on the support of the following ones : 

|Provider | Models | Status |
|---------|--------|---------|
|OpenAI | gpt-4, gpt-4-turbo-preview | Stable |
|Mistral |  mistral-small-latest, mistral-medium-latest, mistral-large-latest | Experimental |
|Anthropic |  Claude | Next Release |
|Groq | Mitral, LLma | Next Release|

You can choose your model with the -m parameter : 

```bash
 ~ julius post -m mistral-large-latest ....
```

Use the help in order to have the list of the models
```bash
 ~ julius post -h 
```
or 

```bash
 ~ julius template-post -h 
```

##  Custom prompts

**Why custom prompts?**
- Default one are too generic.
- Julius's default prompts are written in English. Customs prompts can be created for a specific language.  
- Give the possibility to add persona, writing style, remove IA footprint, add custom editorial brief, .... 


### Default prompts 
Julius uses a set of prompts for content generation that can be customized by creating a new version in a separate directory.
Each prompt is stored in a different file. 

| File name | Description | Inputs |
|---------------------|-----------------------------------------------------------------------------------|---------------------|
| system.txt | Can be used as an editorial brief or to add important information such as personas, editorial style, objectives, ... | None
| audience-intent.txt | Use to generate the audience and intent based on the article's subject. | {language} {topic}|
| outline.txt | Use to generate article structure. | {language} {topic} {country} {audience} {intent} |
| introduction.txt | Use to generate the article's introduction. | {language} {topic} |
| conclusion.txt | Use to generate the article's conclusion. |{language} {topic}|
| heading.txt | Use to generate the content of each heading. |{language} {headingTitle} {keywords}|

### Create a custom prompt

**1. Make a copy of the default prompts**
```bash
 ~ julius prompt create [name] [folder]
```
eg. : 

```bash
 ~ julius prompt create discover ./my-prompts
```

This command will copy the default prompts into the folder : ./my-prompts/discover

**2. Modify the prompts**

Now, you can modify and/or translate the prompts in this folder

**3. Use your prompts in the CLI**

In the automatic mode, the cli will ask you the custom prompt path

```bash
 ~ julius -i 
```

You can also use a CLI parameter "pf" to specify the folder path

```bash
 ~ julius -pf ./my-prompts/discover ...
```

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

This command creates a new post on a Wordpress site.
the JSON file must have the following structure:

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

A plugin example for Yoast can be found in this directory: [julius-wp-plugin](./examples/julius-wp-plugin)
You can create a zip and install it from the Wordpress dashboard.

You can code something similar for other SEO plugins.

```bash
~ julius wp post www.domain.com|id categoryId post.json
```

- The first argument is the domain name or the ID of the site.
- The second argument is the ID of the category on this WordPress. You can get the list of categories with the command `julius wp categories www.domain.com|id`
- The third argument is a boolean to indicate if the WP used Yoast SEO plugin. If true, the SEO title and description will be published.
- The fourth argument is the path to the JSON file containing the post.

### update

This command updates a post on a Wordpress site (title, content, SEO title & SEO description).
the JSON file must have the following structure:

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

- The first argument is the domain name or the ID of the site.
- The second argument is the slug of the post to update.
- The third argument is the JSON file.
- The fourth argument (optional) is to update the publication date or not.

# API

See the unit tests : tests/test-api.spec.ts

# Some Tools that can Help to Check Quality

- [Quillbot](https://try.quillbot.com/74enc3186nhg):  AI-powered paraphrasing tool will enhance your writing, grammar checker and plagiarism checker.
- [Originality](https://originality.ai?lmref=fJgVFg): AI Content Detector and Plagiarism Checker.


# Credit 

- [OpenAI API](https://openai.com/)
- [Langchain](https://js.langchain.com/docs/get_started/introduction)



