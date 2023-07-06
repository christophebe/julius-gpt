import test from 'ava'
import { generateImage } from '../src/lib/image/midjourney'

const IMAGE_PROMPT = `
Generate a realistic photography illustrating the concept of 'administrative management' made by a award winning photographer.
It should include elements commonly associated with administration such as an office desk, paperwork, a laptop, and a calendar. 
Also, incorporate a manager in a professional attire overseeing these tasks. 
The image should reflect a sense of organization, precision, and professionalism in a business setting.

--ar 16:9 --v 5.1 --style raw --q 2 --s 750
`

test.skip('Generate Image', async t => {
  try {
    await generateImage(IMAGE_PROMPT)
  } catch (err) {
    console.log(err)
  }
})
