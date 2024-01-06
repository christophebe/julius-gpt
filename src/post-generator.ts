import * as dotenv from 'dotenv'
import { ChatOpenAI } from '@langchain/openai'
import { BufferMemory } from 'langchain/memory'
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts'
import { getOutlineParser } from './lib/parser'
import { getHumanOutlineTemplate, getSystemOutlineTemplate } from './lib/templates/template'

import {
  PostPrompt
} from './types'

dotenv.config()

/**
 * Class for generating a post.
 */
export class PostGenerator {
  private llm_outline: ChatOpenAI
  private llm_content: ChatOpenAI
  private memory : BufferMemory

  // private completionParams : CompletionParams
  public constructor (private postPrompt: PostPrompt) {
    this.llm_outline = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      verbose: postPrompt.debug
    })

    this.llm_content = new ChatOpenAI({
      modelName: postPrompt.model,
      temperature: postPrompt.temperature ?? 0.8,
      frequencyPenalty: postPrompt.frequencyPenalty ?? 0,
      presencePenalty: postPrompt.presencePenalty ?? 1,
      verbose: postPrompt.debug
    })

    this.memory = new BufferMemory({
      returnMessages: true
    })
  }

  public async generate () : Promise<any> {
    const tableOfContent = await this.generateOutline()
    console.log(tableOfContent)
  }

  public async generateOutline () : Promise<any> {
    const parser = getOutlineParser()

    const sysTemplate = await getSystemOutlineTemplate()
    const humanTemplate = await getHumanOutlineTemplate()
    const chatPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(sysTemplate),
      HumanMessagePromptTemplate.fromTemplate(humanTemplate)
    ])

    const inputVariables = {
      format_instructions: parser.getFormatInstructions(),
      topic: this.postPrompt.topic,
      language: this.postPrompt.language,
      country: this.postPrompt.country,
      audience: this.postPrompt.audience,
      intent: this.postPrompt.intent,
      tone: this.postPrompt.tone
    }

    const chain = chatPrompt
      .pipe(this.llm_outline)
      .pipe(parser)
      // .pipe(this.memory)
    const output = await chain.invoke(inputVariables)

    return output
  }
}
