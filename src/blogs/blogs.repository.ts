/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { Blog } from './entity/blogs.entity';
import { BlogCategory } from './entity/blog_categories.entity';
import { BlogTag } from './entity/blog_tags.entity';
import { CreateBlogDto } from './dto/create-blog.dto';

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
    return this.blogRepository.find({
      relations: ['category', 'tags'],
    });
  }

  async findOneBySlug(slug: string): Promise<Blog | null> {
    return this.blogRepository.findOne({
      where: { slug },
      relations: ['category', 'tags'],
    });
  }

  async findOneByUuid(uuid: string): Promise<Blog | null> {
    return this.blogRepository.findOne({
      where: { blog_uuid: uuid },
      relations: ['category', 'tags'],
    });
  }

  async save(blog: Blog): Promise<Blog> {
    return this.blogRepository.save(blog);
  }

  async remove(blog: Blog): Promise<void> {
    await this.blogRepository.remove(blog);
  }

  async createBlog(dto: CreateBlogDto): Promise<Blog> {
    // Parse tags nếu là string
    const tags = Array.isArray(dto.tags)
      ? dto.tags
      : typeof dto.tags === 'string'
      ? JSON.parse(dto.tags)
      : [];

    // Extract tags & thumbnail khỏi DTO nếu không muốn gán trực tiếp
    const { tags: _, thumbnail_image: __, ...blogData } = dto;

    // Tạo blog entity
    const blog = this.blogRepository.create({
      ...blogData,
      blog_uuid: randomUUID(),
    });

    // Lưu blog trước để có id
    const savedBlog = await this.blogRepository.save(blog);

    // Tạo hoặc lấy tag
    const tagEntities = await Promise.all(
      tags.map(async (tag) => {
        let tagEntity = await this.blogTagRepository.findOne({
          where: { name: tag.name },
        });

        if (!tagEntity) {
          tagEntity = this.blogTagRepository.create({
            name: tag.name,
            slug: tag.slug || tag.name.replace(/\s+/g, '-').toLowerCase(), // Tự động tạo slug nếu không có
          });
          await this.blogTagRepository.save(tagEntity);
        }

        return tagEntity;
      }),
    );

    // Gán tags vào blog
    savedBlog.tags = tagEntities;

    // Lưu lại blog sau khi gán tags
    const finalBlog = await this.blogRepository.save(savedBlog);

    // Return đúng entity
    return finalBlog;
  }

  async findAllCategories(): Promise<any[]> {
    return await this.blogCategoryRepository.find();
  }

  async findCategoryById(id: number): Promise<any> {
    return await this.blogCategoryRepository.findOne({ where: { id } });
  }
}
