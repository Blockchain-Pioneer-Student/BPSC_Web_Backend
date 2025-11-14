/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomUUID } from 'crypto';
import { Blog } from './entity/blogs.entity';
import { BlogCategory } from './entity/blog_categories.entity';
import { BlogTag } from './entity/blog_tags.entity';

@Injectable()
export class BlogsRepository {
    constructor(
        @InjectRepository(Blog)
        private readonly blogRepository: Repository<Blog>,
        @InjectRepository(BlogCategory)
        private readonly blogCategoryRepository: Repository<BlogCategory>,
        @InjectRepository(BlogTag)
        private readonly blogTagRepository: Repository<BlogTag>,
    ) {}
  async findAllBlogs(): Promise<Blog[]> {
    const queryBuilder = this.blogRepository.createQueryBuilder('blog')
      .leftJoinAndSelect('blog.category', 'category')
      .leftJoinAndSelect('blog.tags', 'tags');
    return await queryBuilder.getMany();
  }
}
