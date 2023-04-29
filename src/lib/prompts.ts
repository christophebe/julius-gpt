import { PostPrompt } from '../types'

const STRUCTURE_OUTLINE = 'Generate the blog post outline with the following json format in a bloc code : ' +
'{"title": "", // Add the post title here ' +
'"headings" : [ { "title": "", //Add the heading title here ' +
  '"keywords": ["...", "...", "...", "..."], // Add a list of keywords here. they will help to generate the final content of this heading.' +
  '"headings": [ // If necessary, add subheadings here. This is optional' +
    '{ "title": "", ' + '"keywords": ["...", "..."] },' +
    '{ "title": "", "keywords": ["...", "..."] }, ... ] } ... ],' +
'"slug" : "", // Use the main keywords for the slug based on the topic of the post. Do not mention the country.  Max 3 or 4 keywords, without stop words and with text normalization and accent stripping' +
'"seoTitle" : "", // not the same as the post tile, max 60 characters, do not mention the country' +
'"seoDescription : "" //max 155 characters }'

export function getSystemPrompt (post : PostPrompt) {
  return 'You are a copywriter with a strong expertise in SEO. I need a detailed blog post in ' + post.language + ' about the topic : "' + post.topic + '".'
}

export function getPromptForOutline (postPrompt : PostPrompt) {
  const { country, intent, audience } = postPrompt
  const prompt = STRUCTURE_OUTLINE +
    'Do not add heading for an introduction, conclusion or to summarize the article.' +
    (country === null || country === 'none' ? '' : 'Market/country/region :' + country + '.') +
    (audience === null ? '' : 'Audience : ' + audience + '.') +
    (intent === null ? '' : 'Content intent : ' + intent + '.')
  return prompt
}

export function getPromptForMainKeyword () {
  const prompt = 'Give me the most important SEO keyword in a block code with a json array in which each item match to a word without the stop words'
  return prompt
}

export function getPromptForIntroduction () {
  // const prompt = 'Write the introduction of this blog post. depending on the topic : explain the context and/or explain some the main problem. ' +
  // 'If possible, give some facts. Do not describe or introduce the content of the differents headings ' +
  // ' Do not add a heading. Your responses should be in the markdown format in a block code.'
  const prompt =
  'Compose a captivating introduction for this blog post topic, without using phrases such as "In this article,..." to introduce the subject.' +
  'Instead, focus on creating a hook to capture the reader\'s attention, setting the tone and style, and seamlessly leading the reader into the main content of the article.' +
  'Your introduction should entice readers to continue reading the article and learn more about the subject presented.' + 
  ' Do not add a heading. Your responses should be in the markdown format in a block code.'
  return prompt
}

export function getPromptForHeading (title : string, keywords : string[] | null) {
  const promptAboutKeywords = keywords ? ' based on the following list of keywords : ' + keywords.join(', ') + '.' : ''
  const prompt =
    'Write the content for the heading (without the heading)" ' + title + '"' + promptAboutKeywords +
    'Do not add a conclusion or a summary at the end of this heading. Your responses should be in the markdown format in a block code.'
  return prompt
}

export function getPromptForConclusion () {
  // const prompt = 'Write the conclusion of this blog post. Do not add a heading.' +
  //   'Do NOT begin the conclusion with an adverb or a preposition like "in sum","in conclusion", "in the end", "finally", "to conclude", "to sum up", "in short", "in brief", "in summary", "in esse, ...' +
  //   'Your responses should be in the markdown format in a block code.'
  const prompt = 'Write a compelling conclusion for this blog post topic, without using transitional phrases such as "in conclusion," "in summary," or "in short".' +
  'Focus on summarizing the main points of the post, emphasizing the significance of the topic, and leaving the reader with a lasting impression or a thought-provoking final remark.' +
  'Ensure that your conclusion effectively wraps up the article and reinforces the central message or insights presented in the blog post.' +
  ' Do not add a heading. Your responses should be in the markdown format in a block code.'
  return prompt
}
