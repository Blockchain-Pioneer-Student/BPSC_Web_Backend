/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { CreateBlogDto } from './create-blog.dto';
import { UpdateBlogDto } from './update-blog.dto';

export function parseBlogFormData(
  data: any,
  thumbnail_image?: any,
): CreateBlogDto {
  return {
    title: data.title,
    slug: data.slug,
    thumbnail_url: data.thumbnail_url,
    short_description: data.short_description,
    content: data.content,
    category_id: data.category_id,
    author: data.author,
    published_at: data.published_at,
    is_published: data.is_published,
    tags: data.tags ? JSON.parse(String(data.tags)) : [],
    thumbnail_image,
  };
}

export function parseBlogUpdateFormData(
  data: any,
  thumbnail_image?: any,
): UpdateBlogDto {
  return {
    title: data.title,
    slug: data.slug,
    thumbnail_url: data.thumbnail_url,
    short_description: data.short_description,
    content: data.content,
    category_id: data.category_id,
    author: data.author,
    published_at: data.published_at,
    is_published: data.is_published,
    tags: data.tags ? JSON.parse(String(data.tags)) : undefined,
    thumbnail_image,
  };
}
