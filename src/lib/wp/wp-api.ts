import moment from 'moment-timezone'
import axios from 'axios'
import { Wordpress } from '../store/types'
import { Post } from 'src/types'

type UpdatePost = {
  content: string;
  title: string;
  meta: {
    yoast_wpseo_title: string,
    yoast_wpseo_metadesc: string
  };
  date?: string;
  date_gmt?: string;
}

type WpDateTime = {
  date: string;
  date_gmt: string;
}

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

export async function createPost (wp : Wordpress, post : Post) {
  const { domain, username, password } = wp
  const postData : any = {
    ...post
  }

  postData.meta = {
    yoast_wpseo_title: post.seoTitle,
    yoast_wpseo_metadesc: post.seoDescription
  }

  return await axios.post(`${getApiUrl(domain)}/posts`, postData, authenticate(username, password))
}

export async function updatePost (wp : Wordpress, slug: string, newContent : Post, updateDate : boolean) {
  const { domain, username, password } = wp

  const apiUrl = getApiUrl(domain)
  const response = await axios.get(`${apiUrl}/posts?slug=${slug}`, authenticate(username, password))

  if (response.data.length === 0) {
    throw new Error(`Post with ${slug} not found`)
  }

  const postId: number = response.data[0].id

  const updatedPost : UpdatePost = {
    content: newContent.content,
    title: newContent.title,
    meta: {
      yoast_wpseo_title: newContent.seoTitle,
      yoast_wpseo_metadesc: newContent.seoDescription
    }
  }
  if (updateDate) {
    const dateTime = getCurrentDateTime()
    updatedPost.date = dateTime.date
    updatedPost.date_gmt = dateTime.date_gmt
  }

  await axios.put(`${apiUrl}/posts/${postId}`, updatedPost, authenticate(username, password))
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

function getCurrentDateTime (): WpDateTime {
  const timezone = moment.tz.guess()
  const now = moment().tz(timezone)
  const nowGmt = now.clone().tz('GMT')

  return {
    date: now.format(),
    date_gmt: nowGmt.format()
  }
}
