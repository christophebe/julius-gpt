import { PostPrompt } from '../types'

const OUTLINE_INTO = 'I need an outline for a blog post '
const STRUCTURE_OUTLINE = `The outline should contain headings. If necessary, some headings can contain sub-headings to add more detail. 
Write this outline in a JSON code. it must be a json object with the following structure :
\`\`\`json
{
    "title": "", // Add the post title here
        "headings" : [
            {
                "title": "", //Add the heading title here 
                "keywords": ["...", "...", "...", "..."], // Add a list of keywords here. they will help to generate the final content of this heading.
                "headings": [  // If necessary, add subheagins here. This is optional
                    { "title": "", "keywords": ["...", "..."] },
                    { "title": "", "keywords": ["...", "..."] },
                    ...
                ]
            }
        ...
    ]
}
\`\`\`
You must provide the title of the blog post (in the top level title attribute). 
You must provide the titles and keywords for each headings.
Do not add extra information before or after the JSON code. I need only the JSON code.
`

export function getPromptForOutline (prompt : PostPrompt) {
  const { topic, country, intent, audience, language } = prompt
  return `
    ${OUTLINE_INTO} in ${language} about the topic : "${topic}".
    ${STRUCTURE_OUTLINE}
    Do not add an introduction and a conclusion in this post. I will ask you to write them later.
    Do not add a heading to summarize the article in the outline.
    Additional information: 
    ${country === 'none' ? '' : '- Market/country/region :' + country}
    - content intent : ${intent}
    ${audience === null ? '' : '- audience : ' + audience}
    ${country === 'none' ? '' : '- You should not mention the market/country/region in the titles'}
  `
}

export function getPromptForMainKeyword (prompt : PostPrompt) {
  const { topic, language } = prompt
  return `
    You are a specialist in SEO and web writing. For a blog post in ${language} : "${topic}". Give me the most important keyword you will use in this post. 
    Your answer must contain only the main keyword. Use a block code with a json array in which each item match to a word without the stop words.
  `
}

export function getPromptForIntroduction (language : string) {
  return `
    Write the introduction in ${language} of this blog post.
    Write the content of this introduction in the markdown format in a code block. 
    Do not add a title in the content.
    Does not use preposition and adverbs in the content.
    Do not explain or summarize the content of the post in the introduction.
  `
}

export function getPromptForHeading (language : string, title : string, keywords : string[] | null) : string {
  const promptAboutKeywords = keywords ? ' based on the following list of keywords : ' + keywords.join(', ') : ''
  return `
    Write the content in ${language} for the heading "${title}" of this blog post${promptAboutKeywords}.
    Write the content only in the markdown format in a code block.
    Do not put a title in the content
    Does not use preposition and adverbs in the content.
    Do not add a conclusion in the content or a summary of this heading.
  `
}

export function getPromptForConclusion (language : string) : string {
  return `
    Write the conclusion in ${language} of this blog post.
    Write the content only in the markdown format in a code block.
    Do not add a title in the content.
    Important : do not begin the conclusion with an adverb or a preposition like 
    'in sum', 'in conclusion',  'in short', 'in the end', 'finally', 'to conclude', 'to sum up', 'to summarize', 'to finish', 'to end', 'to wrap up', 'to recap', 'to recapitulate', 'to reiterate', 'to restate', 'to summarize', 'to sum up', ..
  `
}

export function getPromptForSeoTitle (language : string) : string {
  return `
    Write the SEO title in ${language} for this blog post. 
    the content of SEO Title should be different than the blog post title.
    Try to put the most important keywords in the beginning of the title.
    The SEO title must contain between 50 and 60 characters.
    Don't use html code or a code block. 
  `
}

export function getPromptForSeoDescription (language : string) : string {
  return `
    Write an SEO description in ${language} for this blog post. It should make people want to read the article.
    The SEO description must contain between 150 and 165 characters.
    Don't use html code or a code block. Just give me a sentence.
  `
}

export function getPromptForUrl (language : string) : string {
  return `
    Write the path for the url in ${language} for this blog post. 
    Do not add in this url the extension (eg. .html) and the domain name.
    Use the best keywords for the url based on the topic of the post. Max 3 or 4 keywords.
    For example, if the title of the post is "How to generate text with ai", the url should be /generate-text-ai
    Do not use adverbs or prepositions in the url.
  `
}
