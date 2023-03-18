import { PostPrompt } from '../types'

const OUTLINE_INTO = 'I need an outline for a blog post '
const DETAIL_STRUCTURE_OUTLINE = `The outline should contain sections. If necessary, some sections can contain sub-sections to add more detail. 
Write this outline in a JSON code. it must be a json object with the following structure :
\`\`\`json
{
    "title": "", // Add the post title here
        "sections" : [
            {
                "title": "", 
                "keywords": ["...", "..."], // Add a list of keywords here. Each keyword is composed of 2 or 3 words per keywords (or a very small statement). they will help to generate the final content of the section.
                // If necessary, add sub-section here. This is optional
                "sections": [
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
You must provide the titles and keywords for each section.
Do not add extra information before or after the JSON code. I need only the JSON code.
`
const STRUCTURE_OUTLINE = `The outline should contain sections. Write this outline in JSON code. it must be a json object with the following structure :
\`\`\`json
{
    "title": "", // Write a post title here based on the topic
        "sections" : [
            {
                "title": "", 
                "keywords": ["...", "..."] // Add a list of keywords here. each keyword is composed of 2 or 3 words (or it is a very small statement). they will help to generate the final content of the section.
      
            }
        ...
    ]
}
\`\`\`
You must provide the title of the blog post (in the top level title attribute). 
You must provide the titles and keywords for each section. 
Do not add extra information before or after the JSON code. I need only the JSON code.
`

export function getPromptForWritingLikeAHuman () {
  return `
    As a post writer, you have to write like a human. Please, follow the following instructions for wirting the content of this post.
    When it comes to writing content, two factors are crucial, "perplexity" and "burstiness". 
    Perplexity measures the complexity of text. Separately, burstiness compares the variations of sentences. 
    Humans tend to write with greater burstiness. For example, with some longer or complex sentences alongside shoter ones. 
    AI sentences tend to be mode uniform. Therefore, when writing the following content I am going to ask you to create, you have to use this important rule base on perplexity and burstiness. 
  `
}
export function getPromptForOutline (prompt : PostPrompt) {
  const { topic, country, intent, audience, language, optionalh3 } = prompt
  return `
    ${OUTLINE_INTO} in ${language} about the topic : "${topic}".
    ${optionalh3 ? DETAIL_STRUCTURE_OUTLINE : STRUCTURE_OUTLINE}
    Do not add an introduction and a conclusion in this post. I will ask you to write them later.
    Do not add a section to summarize the article in the outline.
    Additional information: 
    ${country === 'none' ? '' : '- Market/country/region :' + country}
    - content intent : ${intent}
    ${audience === null ? '' : '- audience : ' + audience}
    ${country === 'none' ? '' : '- You should not mention the market/country/region in the titles'}
  `
}

export function getPromptForIntroduction (language : string) {
  return `
    Write the introduction in ${language} of this blog post.
    Write the content of this introduction only in html in a code block. For the paragraphs, use the html <p> tag.
    Do not use the following tags : <code> <div> and <pre>.
    Do not add a title in the content.
    Does not use preposition and adverbs in the content.
    Apply the rule of perplecity and burstiness when writing the content.
  `
}

export function getPromptForSection (language : string, title : string, keywords : string[] | null) : string {
  const promptAboutKeywords = keywords ? ' based on the following list of keywords : ' + keywords.join(', ') : ''
  return `
    Write the content in ${language} for the "${title}" section of this blog post ${promptAboutKeywords}.
    Write the content only in html in a code block.
    For paragraphs, use the html <p> tag.
    Do not use the following tags : <code> <div> and <pre>.
    Do not put a title in the content
    Does not use preposition and adverbs in the content.
    Do not add a conclusion in the content or a summary of the section.
    Apply the rule of perplecity and burstiness when writing the content.
  `
}

export function getPromptForConclusion (language : string) : string {
  return `
    Write the conclusion in ${language} of this detailed blog post.
    Write the content of this conclusion only in html in a code block. 
    For paragraphs, use the html <p> tag.
    Do not use the following tags : <code> <div> and <pre>.
    Do not add a title in the content.
    Apply the rule of perplecity and burstiness when writing the content.
  `
}

export function getPromptForSeoTitle (language : string) : string {
  return `
    Write the SEO title in ${language} for this blog post. 
    the content of SEO Title should be different than the blog post title.
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
    Use the best keywords for the url based on the topic of the post.
    For example, if the title of the post is "How to generate text with ai", the url should be /generate-text-ai
    Do not use adverbs or prepositions in the url.
  `
}
