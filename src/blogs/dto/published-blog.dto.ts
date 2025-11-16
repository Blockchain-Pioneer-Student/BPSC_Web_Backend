/* eslint-disable prettier/prettier */
import { BlogTag } from '../entity/blog_tags.entity';

export class PublishedBlogDto {
  blog_uuid: string;
  title: string;
  slug: string;
  thumbnail_url: string;
  short_description: string;
  content: string;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null; // Category is an object or null
  author: string;
  published_at: Date;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  views: number;
  tags: BlogTag[];
}