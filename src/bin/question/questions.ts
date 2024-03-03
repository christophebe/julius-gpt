import inquirer from 'inquirer'
import inquirerPrompt from 'inquirer-autocomplete-prompt'
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt'
import { DEFAULT_LLM, getLLMs } from 'src/types'

inquirer.registerPrompt('autocomplete', inquirerPrompt)
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection)

const LANGUAGES = ['english', 'french', 'spanish', 'german', 'italian', 'russian',
  'portuguese', 'polish', 'turkish', 'swedish', 'norwegian', 'dutch', 'danish',
  'czech', 'greek', 'hungarian', 'finnish', 'romanian', 'bulgarian', 'serbian',
  'slovak', 'croatian', 'ukrainian', 'slovene', 'estonian', 'latvian', 'lithuanian',
  'chinese', 'hindi', 'arabic', 'japanese']

const MODELS = getLLMs()

const questions = [
  {
    type: 'autocomplete',
    name: 'language',
    message: 'Language ?',
    source: (answersSoFar, input) => LANGUAGES.filter((language) => language.startsWith(input)),
    default: 'english'
  },
  {
    type: 'list',
    name: 'model',
    message: 'AI model ?',
    choices: MODELS,
    default: DEFAULT_LLM
  },
  {
    type: 'input',
    name: 'filename',
    message: 'Filename (without extension) ?',
    default: 'post'
  },
  {
    type: 'input',
    name: 'promptFolder',
    message: 'Custom Prompt Folder (enter to skip) ?'
  },
  {
    type: 'input',
    name: 'topic',
    message: 'Topic/ Artitle Title ? '
  },
  {
    type: 'input',
    name: 'country',
    message: 'Country ?',
    default: 'none'

  },
  {
    type: 'input',
    name: 'intent',
    message: 'Intent ?',
    default: 'The article should be informative and offer advice to the reader.'
  },
  {
    type: 'input',
    name: 'audience',
    message: 'Audience ?',
    default: 'The article should be written for a general audience.'
  },
  {
    type: 'confirm',
    name: 'withConclusion',
    message: 'With conclusion ?'
  },
  {
    type: 'number',
    name: 'temperature',
    message: 'Temperature ?',
    default: 0.8
  },
  {
    type: 'number',
    name: 'frequencyPenalty',
    message: 'Frequency Penalty (-2/2) ?',
    default: 1
  },
  {
    type: 'number',
    name: 'presencePenalty',
    message: 'Presence Penalty (-2/2) ?',
    default: 1
  }

]

export async function askQuestions () {
  return inquirer.prompt(questions)
}
