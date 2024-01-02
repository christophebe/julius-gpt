import { ChatGptHelper, GeneratorHelperInterface } from './lib/post-helpers'

import {
  PostPrompt,
  Post
} from './types'
// import { replaceAllPrompts } from './lib/template'

/**
 * Class for generating a post. It need a helper class to generate the post
 * Each helper class must implement the GeneratorHelperInterface
 */
export class PostGenerator {
  private helper : GeneratorHelperInterface
  public constructor (helper : GeneratorHelperInterface) {
    this.helper = helper
  }

  public async generate () : Promise<Post> {
    if (this.helper.isCustom()) {
      // return await this.customGenerate()
      throw new Error('Custom mode is not supported yet')
    } else {
      return await this.autoGenerate()
    }
  }

  /**
   * Generate a post using the custom prompt based on a template
   */
  // private async customGenerate () : Promise<Post> {
  //   const promptContents = []

  //   await this.helper.init()

  //   // We remove the first prompt because it is the system prompt
  //   const prompts = this.helper.getPrompt().prompts.slice(1)

  //   // for each prompt, we generate the content
  //   const templatePrompts = prompts.entries()
  //   for (const [index, prompt] of templatePrompts) {
  //     const content = await this.helper.generateCustomPrompt(prompt)
  //     promptContents.push(content)
  //   }

  //   // We replace the prompts by the AI answer in the template content
  //   const content = replaceAllPrompts(this.helper.getPrompt().templateContent, promptContents)

  //   const seoInfo = await this.helper.generateSeoInfo()

  //   return {
  //     title: seoInfo.h1,
  //     slug: seoInfo.slug,
  //     seoTitle: seoInfo.seoTitle,
  //     seoDescription: seoInfo.seoDescription,
  //     content,
  //     totalTokens: this.helper.getTotalTokens()
  //   }
  // }

  /**
   * Generate a post using the auto mode
   */
  private async autoGenerate () : Promise<Post> {
    await this.helper.init()
    console.log('Generating table of content ...')
    const tableOfContent = await this.helper.generateContentOutline()

    // let content = await this.helper.generateIntroduction()

    // content += await this.helper.generateHeadingContents(tableOfContent)

    // if (this.helper.getPrompt().withConclusion) {
    //   content += await this.helper.generateConclusion()
    // }

    // return {
    //   title: tableOfContent.title,
    //   slug: tableOfContent.slug,
    //   seoTitle: tableOfContent.seoTitle,
    //   seoDescription: tableOfContent.seoDescription,
    //   content,
    //   totalTokens: this.helper.getTotalTokens()
    // }
    return null
  }
}

/**
 * Class for generating a post using the OpenAI API
 */
export class OpenAIPostGenerator extends PostGenerator {
  public constructor (postPrompt : PostPrompt) {
    super(new ChatGptHelper(postPrompt))
  }
}
