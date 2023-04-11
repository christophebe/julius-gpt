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
        text: ' Init ...'
      }
    )

    const tableOfContent = await oraPromise(
      this.helper.generateContentOutline(),
      {
        text: 'Generating post outline ...'
      }
    )

    let content = await oraPromise(
      this.helper.generateIntroduction(),
      {
        text: 'Generating introduction...'
      }
    )

    content += await oraPromise(
      this.helper.generateHeadingContents(tableOfContent),
      {
        text: 'Generating content ...'
      }
    )

    if (this.helper.getPrompt().withConclusion) {
      content += await oraPromise(
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
      content,
      totalTokens: this.helper.getTotalTokens()
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
