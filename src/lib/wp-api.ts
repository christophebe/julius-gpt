import moment from 'moment-timezone'
import axios from 'axios'
import { Category, Wordpress } from './store/types'
import { Post } from 'src/types'

type WpPost = {
  title: string,
  content: string,
  date?: string,
  date_gmt?: string,
  meta: {
    yoast_wpseo_title: string;
    yoast_wpseo_metadesc: string;
  };
};

export async function getCategories(wp: Wordpress): Promise<Category[]> {
  const { domain, username, password } = wp
  const response = await axios.get(`${getApiUrl(domain)}/categories`, authenticate(username, password))

  return response.data.map((category: Category) => {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug
    }
  })
}

export async function createPost(wp: Wordpress, post: Post) {
  const { domain, username, password } = wp
  const postData: WpPost = {
    title: post.h1,
    content: post.content,
    meta: {
      yoast_wpseo_title: post.seoTitle,
      yoast_wpseo_metadesc: post.seoDescription
    }
  }

  return await axios.post(`${getApiUrl(domain)}/posts`, postData, authenticate(username, password))
}

export async function updatePost(wp: Wordpress, slug: string, newContent: Post, publishDate: string) {
  const { domain, username, password } = wp

  const apiUrl = getApiUrl(domain)
  const response = await axios.get(`${apiUrl}/posts?slug=${slug}`, authenticate(username, password))

  if (response.data.length === 0) {
    throw new Error(`Post with ${slug} not found`)
  }

  const postId: number = response.data[0].id

  const updatedPost: WpPost = {
    content: newContent.content,
    title: newContent.h1,
    meta: {
      yoast_wpseo_title: newContent.seoTitle,
      yoast_wpseo_metadesc: newContent.seoDescription
    }
  }
  if (publishDate) {
    updatedPost.date = publishDate
    updatedPost.date_gmt = moment(publishDate).utc().format()
  }

  await axios.put(`${apiUrl}/posts/${postId}`, updatedPost, authenticate(username, password))
}

function getApiUrl(domain: string) {
  return `https://${domain}/wp-json/wp/v2`
}

function authenticate(username: string, password: string) {
  const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64')

  return {
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json'
    }
  }
}
