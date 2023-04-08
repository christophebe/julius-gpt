import inquirer from 'inquirer'
import inquirerPrompt from 'inquirer-autocomplete-prompt'
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt'

inquirer.registerPrompt('autocomplete', inquirerPrompt)
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection)

const LANGUAGES = ['english', 'french', 'spanish', 'german', 'italian', 'russian',
  'portuguese', 'polish', 'turkish', 'swedish', 'norwegian', 'dutch', 'danish',
  'czech', 'greek', 'hungarian', 'finnish', 'romanian', 'bulgarian', 'serbian',
  'slovak', 'croatian', 'ukrainian', 'slovene', 'estonian', 'latvian', 'lithuanian',
  'chinese', 'hindi', 'arabic', 'japanese']

const questions = [
  {
    type: 'autocomplete',
    name: 'language',
    message: 'Language ?',
    source: (answersSoFar, input) => LANGUAGES.filter((language) => language.startsWith(input)),
    default: 'english'
  },
  {
    type: 'input',
    name: 'filename',
    message: 'Filename (without extension) ?',
    default: 'post'
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
    name: 'optionalh3',
    message: 'Detailed blog post (with h3) ?',
    default: false
  },
  {
    type: 'confirm',
    name: 'withConclusion',
    message: 'With conclusion ?'
  },
  {
    type: 'input',
    name: 'temperature',
    message: 'Temperature ?',
    default: 0.7
  },
  {
    type: 'input',
    name: 'frequencyPenalty',
    message: 'Frequency Penalty (-2/2) ?',
    default: -0.5
  },
  {
    type: 'input',
    name: 'presencePenalty',
    message: 'Presence Penalty (-2/2) ?',
    default: 0.5
  },
  
  {
    type: 'input',
    name: 'logitBias',
    message: 'Logit bias ?',
    default: -1
  }

]

// async function selectFile () {
//   const { promptFile } = await inquirer.prompt([
//     {
//       type: 'file-tree-selection',
//       name: 'filePath',
//       message: 'Select the prompt file'
//     }
//   ])

//   console.log(promptFile)
//   return promptFile
// }

export async function askQuestions () {
  return inquirer.prompt(questions)
}
