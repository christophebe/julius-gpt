import test from 'ava'
import fs from 'fs'
import { PostGenerator, GeneratorHelperInterface } from '../src/post'
import { PostPrompt, Section, PostOutline } from '../src/types'

const OUTLINE_FILE = './tests/data/outline-test.json'

test('Generate Post', async t => {
  const helper = new TestHelper()
  const postGenerator = new PostGenerator(helper)
  const result = await postGenerator.generate()
  t.not(result, null)
  t.not(result, '')
  // console.log(result)
})

function readTextFileSync (file) {
  return fs.readFileSync(file, 'utf8')
}

class TestHelper implements GeneratorHelperInterface {
  private postPrompt : PostPrompt = {
    topic: 'this is the topic',
    country: 'USA',
    intent: 'this is the intent',
    audience: 'this is the audience',
    language: 'en',
    optionalh3: true,
    withConclusion: true
  }

  async generateContentOutline () {
    return JSON.parse(readTextFileSync(OUTLINE_FILE))
  }

  async askToWriteLikeAHuman () {
    return 'write like a human - just a test'
  }

  async generateIntroduction () {
    return 'this is the introduction\n\n'
  }

  async generateConclusion () {
    return 'this is the conclusion\n\n'
  }

  public async generateSectionContents (postOutline : PostOutline) {
    const headingLevel = 2

    return await this.generateSectionContent(postOutline.sections, headingLevel, '', '')
  }

  public async generateSEOTitle () {
    return 'this is the seo title'
  }

  public async generateSEODescription () {
    return 'this is the seo description'
  }

  public getPrompt () : PostPrompt {
    return this.postPrompt
  }

  // private async generateSectionContentxxx (chapters : Section[], headingLevel : number, htmlContent : string) : Promise<string> {
  //   return await chapters.reduce(async (htmlContentPromise, chapter) => {
  //     let htmlContent = await htmlContentPromise
  //     htmlContent += `${' '.repeat(headingLevel)}<h${headingLevel}>${chapter.title}</h${headingLevel}>\n`
  //     if (chapter.sections) {
  //       htmlContent += await this.generateSectionContent(chapter.sections, headingLevel + 1, htmlContent)
  //       return Promise.resolve(htmlContent)
  //     } else {
  //       htmlContent += `\t\t\tthis is the chapter content for chapter ${chapter.title} \n\n`
  //       return Promise.resolve(htmlContent)
  //     }
  //   }, Promise.resolve(''))
  // }

  private async generateSectionContent (sections : Section[], headingLevel : number, htmlContent : string, sectionDescription : string) : Promise<string> {
    return await sections.reduce(async (htmlContentPromise, section) => {
      let htmlContent = await htmlContentPromise
      htmlContent += `<h${headingLevel}>${section.title}</h${headingLevel}>\n`
      if (section.sections) {
        htmlContent += await this.generateSectionContent(section.sections, headingLevel + 1, htmlContent, sectionDescription + ' >> ' + section.title)
        return Promise.resolve(htmlContent)
      } else {
        // htmlContent += await this.getChapterContent(this.postPrompt.language, sectionDescription + ' >> ' + section.title, section.keywords)
        return Promise.resolve(htmlContent)
      }
    }, Promise.resolve(''))
  }
}
