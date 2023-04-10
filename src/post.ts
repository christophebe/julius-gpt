import { oraPromise } from 'ora'
import { ChatGptHelper, GeneratorHelperInterface } from './lib/post-helpers'

import {
  PostPrompt,
  Post
} from './types'

/**
 * Class for generating a post. It need a helper class to generate the post
 * Each helper class must implement the GeneratorHelperInterface
 * @class
 */
export class PostGenerator {
  private helper : GeneratorHelperInterface
  public constructor (helper : GeneratorHelperInterface) {
    this.helper = helper
  }

  public async generate () : Promise<Post> {
    await oraPromise(
      this.helper.init(),
      {
        text: ' Init the post ...'
      }
    )

    await oraPromise(
      this.helper.askToWriteLikeAHuman(),
      {
        text: 'Ask to write like a human ...'
      }
    )

    const tableOfContent = await oraPromise(
      this.helper.generateContentOutline(),
      {
        text: 'Generating post outline ...'
      }
    )

    const introduction = await oraPromise(
      this.helper.generateIntroduction(),
      {
        text: 'Generating introduction...'
      }
    )

    let htmlContent = await oraPromise(
      this.helper.generateSectionContents(tableOfContent),
      {
        text: 'Generating content ...'
      }
    )

    if (this.helper.getPrompt().withConclusion) {
      htmlContent += await oraPromise(
        this.helper.generateConclusion(),
        {
          text: 'Generating conclusion...'
        }
      )
    }

    const seoTitle = await oraPromise(
      this.helper.generateSEOTitle(),
      {
        text: 'Generating title seo ...'
      }
    )

    const seoDescription = await oraPromise(
      this.helper.generateSEODescription(),
      {
        text: 'Generating description seo ...'
      }
    )

    const slug = await oraPromise(
      this.helper.generateUrl(),
      {
        text: 'Generating url ...'
      }
    )

    return {
      slug,
      seoTitle,
      seoDescription,
      title: tableOfContent.title,
      content: `${introduction}\n${htmlContent}`
    }
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
