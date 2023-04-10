import { ChatGPTAPI, ChatMessage } from 'chatgpt'
import pRetry, { AbortError } from 'p-retry'
import { extractPostOutlineFromCodeBlock, extractHtmlCodeBlock, extractJsonArray } from './extractor'
import {
  getPromptForOutline,
  getPromptForIntroduction,
  getPromptForSection,
  getPromptForConclusion,
  getPromptForSeoTitle,
  getPromptForSeoDescription,
  getPromptForUrl,
  getPromptForWritingLikeAHuman,
  getPromptForMainKeyword
} from './prompts'
import {
  PostPrompt,
  Section,
  PostOutline
} from '../types'

import { encode } from './tokenizer'

/**
* Specific Open AI API parameters for the completion
*/
export type CompletionParams = {
  temperature?: number | null,
  top_p?: number | null,
  max_tokens?: number,
  presence_penalty?: number | null,
  frequency_penalty?: number | null,
  logit_bias?: object | null,
}

/**
 * Interface for the helper class for generating a post. it defines how to generate a post
 * Each helper class must implement this interface
 * @interface
 */
export interface GeneratorHelperInterface {
  init () : Promise<void>
  getPrompt () : PostPrompt
  askToWriteLikeAHuman () : Promise<String>
  generateContentOutline () : Promise<PostOutline>
  generateMainKeyword () : Promise<string[]>
  generateIntroduction () : Promise<string>
  generateConclusion () : Promise<string>
  generateSectionContents (tableOfContent : PostOutline) : Promise<string>
  generateSEOTitle() : Promise<string>
  generateSEODescription() : Promise<string>
  generateUrl() : Promise<string>
}

/**
 * Helper implementation for generating a post using the ChatGPT API
 * @class
 */
export class ChatGptHelper implements GeneratorHelperInterface {
  private api : ChatGPTAPI
  private chatMessage : ChatMessage
  private completionParams : CompletionParams

  public constructor (private postPrompt : PostPrompt) {
    this.api = new ChatGPTAPI({
      apiKey: postPrompt?.apiKey || process.env.OPENAI_API_KEY,
      completionParams: {
        model: postPrompt.model
      },
      maxModelTokens: postPrompt.maxModelTokens,
      debug: postPrompt.debugapi
    })

    if (postPrompt.debug) {
      console.log(`OpenAI API initialized with model : ${postPrompt.model} and maxModelTokens : ${postPrompt.maxModelTokens}`)
    }
  }

  async init () {
    this.completionParams = {
      temperature: this.postPrompt.temperature || 0.7,
      frequency_penalty: this.postPrompt.frequencyPenalty || -0.5,
      presence_penalty: this.postPrompt.presencePenalty || 0.5
    }

    if (this.postPrompt.logitBias !== 0) {
      const mainKwWords = await this.generateMainKeyword()
      // set the logit bias in order to force the model to minimize the usage of the main keyword
      const logitBiais : Record<number, number> = {}
      mainKwWords.forEach((kw) => {
        const encoded = encode(kw)
        encoded.forEach((element) => {
          logitBiais[element] = Number(this.postPrompt.logitBias) || -1
        })
      })
      this.completionParams.logit_bias = logitBiais
    }

    if (this.postPrompt.debug) {
      console.log('---------- COMPLETION PARAMETERS ----------')
      console.log('Temperature : ' + this.completionParams.temperature)
      console.log('Frequency Penalty : ' + this.completionParams.frequency_penalty)
      console.log('Presence Penalty : ' + this.completionParams.presence_penalty)
      console.log('Logit Biais : ' + this.completionParams.logit_bias)
    }
  }

  public getPrompt () {
    return this.postPrompt
  }

  async generateMainKeyword () {
    const prompt = getPromptForMainKeyword(this.postPrompt)
    if (this.postPrompt.debug) {
      console.log('---------- PROMPT MAIN KEYWORD ----------')
      console.log(prompt)
    }
    this.chatMessage = await this.sendRequest(prompt)
    if (this.postPrompt.debug) {
      console.log('---------- OUTLINE ----------')
      console.log(this.chatMessage.text)
    }

    return extractJsonArray(this.chatMessage.text)
  }

  async generateContentOutline () {
    const prompt = getPromptForOutline(this.postPrompt)
    if (this.postPrompt.debug) {
      console.log('---------- PROMPT OUTLINE ----------')
      console.log(prompt)
    }
    this.chatMessage = await this.sendRequest(prompt)
    if (this.postPrompt.debug) {
      console.log('---------- OUTLINE ----------')
      console.log(this.chatMessage.text)
    }

    return extractPostOutlineFromCodeBlock(this.chatMessage.text)
  }

  async askToWriteLikeAHuman () {
    this.chatMessage = await this.sendRequest(getPromptForWritingLikeAHuman())
    if (this.postPrompt.debug) {
      console.log('---------- Write like a human --------')
      console.log(this.chatMessage.text)
    }
    return this.chatMessage.text
  }

  async generateIntroduction () {
    this.chatMessage = await this.sendRequest(getPromptForIntroduction(this.postPrompt.language), this.completionParams)
    return extractHtmlCodeBlock(this.chatMessage.text)
  }

  async generateConclusion () {
    this.chatMessage = await this.sendRequest(getPromptForConclusion(this.postPrompt.language), this.completionParams)
    return extractHtmlCodeBlock(this.chatMessage.text)
  }

  async generateSEOTitle () {
    this.chatMessage = await this.sendRequest(getPromptForSeoTitle(this.postPrompt.language))
    return this.chatMessage.text
  }

  async generateSEODescription () {
    this.chatMessage = await this.sendRequest(getPromptForSeoDescription(this.postPrompt.language))
    return this.chatMessage.text
  }

  async generateUrl () {
    this.chatMessage = await this.sendRequest(getPromptForUrl(this.postPrompt.language))
    return this.chatMessage.text
  }

  async generateSectionContents (postOutline : PostOutline) {
    const headingLevel = 2

    return await this.getHeadingContent(postOutline.sections, headingLevel, '', '')
  }

  private async getHeadingContent (sections: Section[], headingLevel: number, htmlContent: string, sectionDescription: string): Promise<string> {
    return await sections.reduce(async (htmlContentPromise, section) => {
      let htmlContent = await htmlContentPromise
      htmlContent += `<h${headingLevel}>${section.title}</h${headingLevel}>\n`

      const generateHtmlContent = async (withSections: boolean, sectionTitle: string) => {
        if (withSections) {
          return await this.getHeadingContent(section.sections, headingLevel + 1, htmlContent, sectionDescription + ' >> ' + sectionTitle)
        } else {
          return await this.getChapterContent(this.postPrompt.language, sectionDescription + ' >> ' + sectionTitle, section.keywords)
        }
      }

      htmlContent += await generateHtmlContent(!!section.sections, section.title)

      return Promise.resolve(htmlContent)
    }, Promise.resolve(''))
  }

  private async getChapterContent (language : string, chapterDescription : string, keywords : string[]) {
    if (this.postPrompt.debug) {
      console.log(`\nChapter : ${chapterDescription}  ...'\n`)
    }
    this.chatMessage = await this.sendRequest(getPromptForSection(language, chapterDescription, keywords), this.completionParams)
    return `${extractHtmlCodeBlock(this.chatMessage.text)}\n\n`
  }

  private async sendRequest (prompt : string, completionParams? : CompletionParams) {
    return await pRetry(async () => {
      return await this.api.sendMessage(prompt, {
        parentMessageId: this.chatMessage?.id,
        completionParams
      })
    }, {
      retries: 10,
      onFailedAttempt: async (error) => {
        if (this.postPrompt.debug) {
          console.log('---------- OPENAI REQUEST ERROR ----------')
          console.log(error)
        }
        if (error instanceof AbortError) {
          console.log('OpenAI API - Request aborted')
        } else {
          console.log(`OpenAI API - Request failed - Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`)
        }
      }
    })
  }
}
