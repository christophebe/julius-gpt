import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatMistralAI } from '@langchain/mistralai'
import { ChatOpenAI } from '@langchain/openai'
import { BasePostPrompt } from '../types'

export function buildLLM(postPrompt: BasePostPrompt, forJson: boolean = false): BaseChatModel {
  switch (postPrompt.model) {
    case 'gpt-4o':
    case 'gpt-4o-mini':
    case 'o1-preview':
    case 'o1-mini':
      return buildOpenAI(postPrompt, forJson)
    case 'mistral-small-latest':
    case 'mistral-medium-latest':
    case 'mistral-large-latest':
      return buildMistral(postPrompt, forJson)

    default:
      return buildOpenAI(postPrompt, forJson)
  }
}

function buildOpenAI(postPrompt: BasePostPrompt, forJson: boolean = false) {
  const llmParams = {
    modelName: postPrompt.model.toString(),
    temperature: postPrompt.temperature ?? 0.8,
    frequencyPenalty: forJson ? 0 : postPrompt.frequencyPenalty ?? 1,
    presencePenalty: forJson ? 0 : postPrompt.presencePenalty ?? 1,
    verbose: postPrompt.debugapi,
    openAIApiKey: postPrompt.apiKey

  }
  return new ChatOpenAI(llmParams)
}

function buildMistral(postPrompt: BasePostPrompt, forJson: boolean = false) {
  const llmParams = {
    modelName: postPrompt.model.toString(),
    temperature: postPrompt.temperature ?? 0.8,
    frequencyPenalty: forJson ? 0 : postPrompt.frequencyPenalty ?? 1,
    presencePenalty: forJson ? 0 : postPrompt.presencePenalty ?? 1,
    verbose: postPrompt.debugapi,
    apiKey: postPrompt.apiKey

  }
  return new ChatMistralAI(llmParams)
}
