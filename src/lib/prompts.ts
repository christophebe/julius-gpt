import { PostPrompt } from '../types'

const STRUCTURE_OUTLINE = 'Generate the blog post outline with the following json format : ' +
'{"title": "", // Add the post title here ' +
'"headings" : [ { "title": "", //Add the heading title here ' +
  '"keywords": ["...", "...", "...", "..."], // Add a list of keywords here. they will help to generate the final content of this heading.' +
  '"headings": [ // If necessary, add subheadings here. This is optional' +
    '{ "title": "", ' + '"keywords": ["...", "..."] },' +
    '{ "title": "", "keywords": ["...", "..."] }, ... ] } ... ],' +
'"slug" : "", // Use the main keywords for the slug based on the topic of the post. Do not mention the country.  Max 3 or 4 keywords, without stop words and with text normalization and accent stripping' +
'"seoTitle" : "", // not the same as the post tile, max 60 characters, do not mention the country' +
'"seoDescription : "" //max 155 characters }'

const INFORMATIVE_INTRO_PROMPT = 'Compose the introduction for this blog post topic, without using phrases such as "In this article,..." to introduce the subject.' +
  'Instead, explain the context and/or explain the main problem. If possible, give some facts. Do not describe or introduce the content of the differents headings of the outline' +
  ' Do not add a heading. Your responses should be in the markdown format.'

const CAPTIVATING_INTO_PROMPT = 'Compose a captivating introduction for this blog post topic, without using phrases such as "In this article,..." to introduce the subject.' +
  'Instead, focus on creating a hook to capture the reader\'s attention, setting the tone and style, and seamlessly leading the reader into the main content of the article.' +
  'Your introduction should entice readers to continue reading the article and learn more about the subject presented.' +
  ' Do not add a heading. Your responses should be in the markdown format.'

export function getAutoSystemPrompt (postPrompt : PostPrompt) {
  return 'You are a copywriter with a strong expertise in SEO. I need a detailed blog post in ' + postPrompt.language + ' about the topic : "' + postPrompt.topic + '".'
}

export function getCustomSystemPrompt (postPrompt : PostPrompt) {
  return postPrompt.prompts[0] + '\n' +
  'Language : ' + postPrompt.language + '. ' +
  (postPrompt.topic
    ? 'Topic : ' + postPrompt.topic + '. '
    : '') +
  (postPrompt.country && postPrompt.country !== 'none'
    ? 'Country : ' + postPrompt.country + '. '
    : '') +
  (postPrompt.intent
    ? 'Intent : ' + postPrompt.intent + '. '
    : '') +
  (postPrompt.audience
    ? 'Audience : ' + postPrompt.audience + '. '
    : '') +
  (postPrompt.tone
    ? 'Tone : ' + postPrompt.tone + '. '
    : '')
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
  const prompt = 'Give me the most important SEO keyword in a json array in which each item match to a word without the stop words'
  return prompt
}

export function getPromptForIntroduction (postPrompt : PostPrompt) {
  return (!postPrompt.tone) || postPrompt.tone === 'informative' ? INFORMATIVE_INTRO_PROMPT : CAPTIVATING_INTO_PROMPT
}

export function getPromptForHeading (tone : string, title : string, keywords : string[] | null) {
  return tone === 'informative' ? getPromptForInformativeHeading(title, keywords) : getPromptForCaptivatingHeading(title, keywords)
}

export function getPromptForConclusion () {
  return 'Write a compelling conclusion for this blog post topic, without using transitional phrases such as "in conclusion," "in summary," "in short", "so", "thus", ... or any other transitional expression' +
  'Focus on summarizing the main points of the post, emphasizing the significance of the topic, and leaving the reader with a lasting impression or a thought-provoking final remark.' +
  'Ensure that your conclusion effectively wraps up the article and reinforces the central message or insights presented in the blog post.' +
  'Do not add a heading. Your responses should be in the markdown format.'
}

export function getSeoSystemPrompt (postPrompt : PostPrompt) {
  return 'You are a SEO expert and you need to optimise an web page. ' +
  'Language : ' + postPrompt.language + '. ' +
  (postPrompt.topic
    ? 'Topic : ' + postPrompt.topic + '. '
    : '') +
  (postPrompt.country
    ? 'Country : ' + postPrompt.country + '. '
    : '') +
  (postPrompt.topic
    ? 'Topic : ' + postPrompt.topic + '. '
    : '') +
  (postPrompt.country && postPrompt.country !== 'none'
    ? 'Country : ' + postPrompt.country + '. '
    : '') +
  (postPrompt.intent
    ? 'Intent : ' + postPrompt.intent + '. '
    : '') +
  (postPrompt.audience
    ? 'Audience : ' + postPrompt.audience + '. '
    : '') +
  (postPrompt.tone
    ? 'Tone : ' + postPrompt.tone + '. '
    : '')
}

export function getPromptForSeoInfo (postPrompt : PostPrompt) {
  return 'For a content with the following topic : ' + postPrompt.topic +
  ', with the following intent : ' + postPrompt.intent +
  ', write a slug, a seo title and a seo description for this blog post topic in ' + postPrompt.language + '.' +
  'The seo title should be no more than 60 characters long.' +
  'the seo description should be no more than 155 characters long.' +
  'Use the main keywords for the slug based on the topic of the post. Do not mention the country.  Max 3 or 4 keywords, without stop words and with text normalization and accent stripping' +
  'your response should be in the json format based on the following structure : ' +
  '{"seoTitle": "", "": "seoDescription": "", "slug": ""}'
}

function getPromptForInformativeHeading (title : string, keywords : string[] | null) {
  const promptAboutKeywords = keywords ? ' based on the following list of keywords : ' + keywords.join(', ') + '.' : ''
  return 'Write an informative content for the heading (without the heading) : "' + title + '"' + promptAboutKeywords +
    'Do not add a conclusion or a summary at the end of this heading. Your response should be in the markdown format.'
}

function getPromptForCaptivatingHeading (title : string, keywords : string[] | null) {
  const promptAboutKeywords = keywords ? ' based on the following list of keywords : ' + keywords.join(', ') + '.' : ''

  return 'Write an captivating content for the heading (without the heading) : "' + title + '"' + promptAboutKeywords +
  'Ensure to providing in-depth information and valuable insights.Use clear and concise language, along with relevant examples or anecdotes, to engage the reader and enhance their understanding.' +
  'Do not add a conclusion or a summary at the end of this heading. Your response should be in the markdown format.'
}
