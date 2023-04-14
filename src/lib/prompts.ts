import { PostPrompt } from '../types'

const STRUCTURE_OUTLINE = 'Generate the blog post outline with the following json format in a bloc code : ' +
'{"title": "", // Add the post title here "headings" : [ { "title": "", //Add the heading title here "keywords": ["...", "...", "...", "..."], // Add a list of keywords here. they will help to generate the final content of this heading. "headings": [ // If necessary, add subheagins here. This is optional { "title": "", "keywords": ["...", "..."] }, { "title": "", "keywords": ["...", "..."] }, ... ] } ... ], "slug" : "", // Use the best keywords for the slug based on the topic of the post. Max 3 or 4 keywords. For example, if the title of the post is "How to generate text with ai", the url should be /generate-text-ai "seoTitle" : "", // not the same the post tile, max 60 characters "seoDescription : "" //max 155 characters }'

export function getSystemPrompt (post : PostPrompt) {
  return 'You are a web copywriter with a strong expertise in SEO. I need a detailed blog post in ' + post.language + ' about the topic : "' + post.topic + '".'
}

export function getPromptForOutline (postPrompt : PostPrompt) {
  const { country, intent, audience } = postPrompt
  const prompt = STRUCTURE_OUTLINE +
    'Do not add an introduction and a conclusion in this outline.' +
    'Do not add a heading to summarize the article in the outline.' +
    (country === 'none' ? '' : 'Market/country/region :' + country + '.') +
    'Content intent : ' + intent + '.' +
    (audience === null ? '' : 'Audience : ' + audience + '.')
  return prompt
}

export function getPromptForMainKeyword () {
  const prompt = 'Give me the most important SEO keyword in a block code with a json array in which each item match to a word without the stop words'
  return prompt
}

export function getPromptForIntroduction () {
  const prompt = 'Write the introduction of this blog post. Do not add a heading.Your responses should be in the markdown format in a block code.'
  return prompt
}

export function getPromptForHeading (title : string, keywords : string[] | null) : string {
  const promptAboutKeywords = keywords ? ' based on the following list of keywords : ' + keywords.join(', ') + '.' : ''
  const prompt =
    'Write the content for the heading (without the heading)"' + title + "'" + promptAboutKeywords +
    'Do not add a conclusion in the content or a summary of this heading. Your responses should be in the markdown format in a block code.'
  return prompt
}

export function getPromptForConclusion () : string {
  const prompt = 'Write the conclusion of this blog post. Do not add a heading.' +
    'Do NOT begin the conclusion with an adverb or a preposition like "in sum","in conclusion", "in the end", "finally", "to conclude", "to sum up", "in short", "in brief", "in summary", "in esse, ...' +
    'Your responses should be in the markdown format in a block code.'
  return prompt
}

// export function getPromptForSeoTitle (language : string) : string {
//   return `
//     Write the SEO title in ${language} for this blog post.
//     the content of SEO Title should be different than the blog post title.
//     Try to put the most important keywords in the beginning of the title.
//     The SEO title must contain between 50 and 60 characters.
//     Don't use html code or a code block.
//   `
// }

// export function getPromptForSeoDescription (language : string) : string {
//   return `
//     Write an SEO description in ${language} for this blog post. It should make people want to read the article.
//     The SEO description must contain between 150 and 165 characters.
//     Don't use html code or a code block. Just give me a sentence.
//   `
// }

// export function getPromptForUrl (language : string) : string {
//   return `
//     Write the path for the url in ${language} for this blog post.
//     Do not add in this url the extension (eg. .html) and the domain name.
//     Use the best keywords for the url based on the topic of the post. Max 3 or 4 keywords.
//     For example, if the title of the post is "How to generate text with ai", the url should be /generate-text-ai
//     Do not use adverbs or prepositions in the url.
//   `
// }
