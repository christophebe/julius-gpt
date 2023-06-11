import axios from 'axios'
import { Wordpress } from '../store/types'
import { Post } from 'src/types'

export async function getCategories (wp : Wordpress) {
  const { domain, username, password } = wp
  const response = await axios.get(`${getApiUrl(domain)}/categories`, authenticate(username, password))

  return response.data.map((category) => {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug
    }
  })
}

export async function post (wp : Wordpress, post : Post, isYoastPlugin : boolean) {
  const { domain, username, password } = wp
  const postData : any = {
    ...post
  }

  if (isYoastPlugin) {
    postData.yoast_meta = {
      yoast_wpseo_title: post.seoTitle,
      yoast_wpseo_metadesc: post.seoDescription
    }
  }

  return await axios.post(`${getApiUrl(domain)}/posts`, postData, authenticate(username, password))
}

function getApiUrl (domain) {
  return `https://${domain}/wp-json/wp/v2`
}

function authenticate (username : string, password : string) {
  const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64')

  return {
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json'
    }
  }
};
