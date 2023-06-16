import * as dotenv from 'dotenv'
import { readFile as rd } from 'fs'
import { promisify } from 'util'
import { ChatGPTAPI, ChatGPTError, ChatMessage, SendMessageOptions } from 'chatgpt'
import pRetry, { AbortError, FailedAttemptError } from 'p-retry'
import { extractJsonArray, extractCodeBlock, extractPostOutlineFromCodeBlock, extractSeoInfo } from './extractor'
import {
  getPromptForMainKeyword,
  getPromptForOutline,
  getPromptForIntroduction,
  getPromptForHeading,
  getPromptForConclusion,
  getAutoSystemPrompt,
  getPromptForSeoInfo,
  getCustomSystemPrompt,
  getSeoSystemPrompt
} from './prompts'
import {
  Heading,
  PostOutline,
  PostPrompt,
  TotalTokens,
  SeoInfo
} from '../types'

import { encode } from './tokenizer'
import { extractPrompts } from './template'
import { log } from 'console'
import { NoApiKeyError } from './errors'

dotenv.config()

const readFile = promisify(rd)

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
  isCustom() : boolean
  generateContentOutline () : Promise<PostOutline>
  generateMainKeyword () : Promise<string[]>
  generateIntroduction () : Promise<string>
  generateConclusion () : Promise<string>
  generateHeadingContents (tableOfContent : PostOutline) : Promise<string>
  generateCustomPrompt(prompt : string) : Promise<string>
  generateSeoInfo () : Promise<SeoInfo>
  getTotalTokens() : TotalTokens
  getPrompt() : PostPrompt
}

/**
 * Helper implementation for generating a post using the ChatGPT API
 * @class
 */
export class ChatGptHelper implements GeneratorHelperInterface {
  private postPrompt : PostPrompt
  private api : ChatGPTAPI
  // The parent message is either the previous one in the conversation (if a template is used)
  // or the generated outline (if we are in auto mode)
  private chatParentMessage : ChatMessage
  private completionParams : CompletionParams
  private totalTokens : TotalTokens = {
    promptTokens: 0,
    completionTokens: 0,
    total: 0
  }

  // -----------------------------------------------
  // CONSTRUCTOR AND INITIALIZATION
  // -----------------------------------------------
  public constructor (postPrompt : PostPrompt) {
    this.postPrompt = postPrompt
  }

  isCustom () : boolean {
    return this.postPrompt?.templateFile !== undefined
  }

  getPrompt (): PostPrompt {
    return this.postPrompt
  }

  getTotalTokens (): TotalTokens {
    return this.totalTokens
  }

  async init () {
    if (this.isCustom()) {
      if (this.postPrompt.debug) {
        console.log(`Use template : ${this.postPrompt.templateFile}`)
      }
      this.postPrompt.templateContent = await this.readTemplate()
      this.postPrompt.prompts = extractPrompts(this.postPrompt.templateContent)
    }

    const systemMessage = this.isCustom() ? getCustomSystemPrompt(this.postPrompt) : getAutoSystemPrompt(this.postPrompt)
    await this.buildChatGPTAPI(systemMessage)
  }

  private async buildChatGPTAPI (systemMessage : string) {
    try {
      this.api = new ChatGPTAPI({
        apiKey: this.postPrompt?.apiKey || process.env.OPENAI_API_KEY,
        completionParams: {
          model: this.postPrompt.model
        },
        systemMessage,
        debug: this.postPrompt.debugapi
      })
    } catch (error) {
      throw new NoApiKeyError()
    }

    if (this.postPrompt.debug) {
      console.log(`OpenAI API initialized with model : ${this.postPrompt.model}`)
    }

    this.completionParams = {
      temperature: this.postPrompt.temperature ?? 0.8,
      frequency_penalty: this.postPrompt.frequencyPenalty ?? 0,
      presence_penalty: this.postPrompt.presencePenalty ?? 1
    }

    if (this.postPrompt.logitBias) {
      const mainKwWords = await this.generateMainKeyword()
      // set the logit bias in order to force the model to minimize the usage of the main keyword
      const logitBiais: Record<number, number> = {}
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
      console.log('Max Tokens  : ' + this.completionParams.max_tokens)
      console.log('Temperature : ' + this.completionParams.temperature)
      console.log('Frequency Penalty : ' + this.completionParams.frequency_penalty)
      console.log('Presence Penalty : ' + this.completionParams.presence_penalty)
      console.log('Logit Biais : ' + this.completionParams.logit_bias)
    }
  }

  // -----------------------------------------------
  // METHODS FOR THE AUTOMATIC MODE
  // -----------------------------------------------
  async generateMainKeyword () {
    const prompt = getPromptForMainKeyword()
    if (this.postPrompt.debug) {
      console.log('---------- PROMPT MAIN KEYWORD ----------')
      console.log(prompt)
    }
    const response = await this.sendRequest(prompt)
    if (this.postPrompt.debug) {
      console.log('---------- MAIN KEYWORD ----------')
      console.log(response.text)
    }

    return extractJsonArray(response.text)
  }

  async generateContentOutline () {
    const prompt = getPromptForOutline(this.postPrompt)
    if (this.postPrompt.debug) {
      console.log('---------- PROMPT OUTLINE ----------')
      console.log(prompt)
    }
    // the parent message is the outline for the upcoming content
    // By this way, we can mimize the cost of the API call by minimising the number of prompt tokens
    // TODO : add an option to disable this feature
    this.chatParentMessage = await this.sendRequest(prompt)
    if (this.postPrompt.debug) {
      console.log('---------- OUTLINE ----------')
      console.log(this.chatParentMessage.text)
    }

    return extractPostOutlineFromCodeBlock(this.chatParentMessage.text)
  }

  async generateIntroduction () {
    const response = await this.sendRequest(getPromptForIntroduction(this.postPrompt), this.completionParams)
    return extractCodeBlock(response.text)
  }

  async generateConclusion () {
    const response = await this.sendRequest(getPromptForConclusion(), this.completionParams)
    return extractCodeBlock(response.text)
  }

  async generateHeadingContents (postOutline : PostOutline) {
    const headingLevel = 2

    return await this.buildContent(postOutline.headings, headingLevel)
  }

  private async buildContent (headings: Heading[], headingLevel : number, previousContent: string = ''): Promise<string> {
    if (headings.length === 0) {
      return previousContent
    }
    const [currentHeading, ...remainingHeadings] = headings

    const mdHeading = Array(headingLevel).fill('#').join('')
    let content = previousContent + '\n' + mdHeading + ' ' + currentHeading.title

    if (currentHeading.headings && currentHeading.headings.length > 0) {
      content = await this.buildContent(currentHeading.headings, headingLevel + 1, content)
    } else {
      content += '\n' + await this.getContent(currentHeading)
    }

    return this.buildContent(remainingHeadings, headingLevel, content)
  }

  private async getContent (heading: Heading): Promise<string> {
    if (this.postPrompt.debug) {
      console.log(`\nHeading : ${heading.title}  ...'\n`)
    }
    const response = await this.sendRequest(getPromptForHeading(this.postPrompt.tone, heading.title, heading.keywords), this.completionParams)
    return `${extractCodeBlock(response.text)}\n`
  }

  // -----------------------------------------------
  // METHODS FOR THE CUSTOM MODE base on a template
  // -----------------------------------------------

  /**
   * Generate a content based on one of prompt defined in the template
   * @param customPrompt :  the prompt defined in the template
   * @returns the AI answer
   */
  async generateCustomPrompt (customPrompt : string) {
    this.chatParentMessage = await this.sendRequest(customPrompt, this.completionParams)
    return extractCodeBlock(this.chatParentMessage.text)
  }

  /**
   * Generate the SEO info for the post based on the template
   * @returns the SEO info
   */
  async generateSeoInfo (): Promise<SeoInfo> {
    const systemPrompt = getSeoSystemPrompt(this.postPrompt)
    await this.buildChatGPTAPI(systemPrompt)

    this.chatParentMessage = await this.sendRequest(getPromptForSeoInfo(this.postPrompt), this.completionParams)
    if (this.postPrompt.debug) {
      log('---------- SEO INFO ----------')
      console.log(this.chatParentMessage.text)
    }
    return extractSeoInfo(this.chatParentMessage.text)
  }

  private async readTemplate () : Promise<string> {
    const templatePath = this.postPrompt.templateFile
    return await readFile(templatePath, 'utf-8')
  }

  // -----------------------------------------------
  // SEND REQUEST TO OPENAI API
  // -----------------------------------------------
  private async sendRequest (prompt : string, completionParams? : CompletionParams) {
    return await pRetry(async () => {
      const options : SendMessageOptions = { parentMessageId: this.chatParentMessage?.id }
      if (completionParams) {
        options.completionParams = completionParams
      }

      const response = await this.api.sendMessage(prompt, options)
      this.totalTokens.promptTokens += response.detail.usage.prompt_tokens
      this.totalTokens.completionTokens += response.detail.usage.completion_tokens
      this.totalTokens.total += response.detail.usage.total_tokens
      return response
    }, {
      retries: 10,
      onFailedAttempt: async (error) => {
        this.manageError(error)
      }
    })
  }

  private manageError (error: FailedAttemptError) {
    if (this.postPrompt.debug) {
      console.log('---------- OPENAI REQUEST ERROR ----------')
      console.log(error)
    }
    if (error instanceof ChatGPTError) {
      const chatGPTError = error as ChatGPTError
      if (chatGPTError.statusCode === 401) {
        console.log('OpenAI API Error : Invalid API key: please check your API key in the option -k or in the OPENAI_API_KEY env var.')
        process.exit(1)
      }
      if (chatGPTError.statusCode === 404) {
        console.log(`OpenAI API Error :  Invalid model for your OpenAI subscription. Check if you can use : ${this.postPrompt.model}.`)
        console.log(this.postPrompt.model === 'gpt-4' || this.postPrompt.model === 'gpt-4-32k' ? 'You need to join the waitlist to use the GPT-4 API : https://openai.com/waitlist/gpt-4-api' : '')
        process.exit(1)
      }
    }

    if (error instanceof AbortError) {
      console.log(`OpenAI API - Request aborted. ${error.message}`)
    } else {
      console.log(`OpenAI API - Request failed - Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left. ${error.message}`)
    }
  }
}
