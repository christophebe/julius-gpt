import * as dotenv from 'dotenv'
import { Midjourney } from 'midjourney'

dotenv.config()

export async function generateImage (prompt : string) : Promise<string[]> {
  const client = new Midjourney({
    ServerId: process.env.SERVER_ID,
    ChannelId: process.env.CHANNEL_ID,
    SalaiToken: process.env.SALAI_TOKEN,
    Debug: true,
    Ws: true
  })
  await client.Connect()
  const imagine = await client.Imagine(prompt)

  const upscale1 = await client.Upscale({
    index: 1,
    msgId: <string>imagine.id,
    hash: <string>imagine.hash,
    flags: imagine.flags,
    loading: (uri: string, progress: string) => {
      console.log('Upscale.loading', uri, 'progress', progress)
    }
  })

  const upscale2 = await client.Upscale({
    index: 2,
    msgId: <string>imagine.id,
    hash: <string>imagine.hash,
    flags: imagine.flags,
    loading: (uri: string, progress: string) => {
      console.log('Upscale.loading', uri, 'progress', progress)
    }
  })

  const upscale3 = await client.Upscale({
    index: 3,
    msgId: <string>imagine.id,
    hash: <string>imagine.hash,
    flags: imagine.flags,
    loading: (uri: string, progress: string) => {
      console.log('Upscale.loading', uri, 'progress', progress)
    }
  })

  const upscale4 = await client.Upscale({
    index: 4,
    msgId: <string>imagine.id,
    hash: <string>imagine.hash,
    flags: imagine.flags,
    loading: (uri: string, progress: string) => {
      console.log('Upscale.loading', uri, 'progress', progress)
    }
  })

  return [upscale1.uri, upscale2.uri, upscale3.uri, upscale4.uri]
}
