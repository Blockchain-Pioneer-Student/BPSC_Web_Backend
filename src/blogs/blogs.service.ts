/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { UploadService } from '../shared/upload/upload.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogsRepository } from './blogs.repository';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Blog } from './entity/blogs.entity';
@Injectable()
export class BlogsService {
    constructor(
        private readonly blogsRepository: BlogsRepository,
        private readonly uploadService: UploadService,
    ) { }
    async getAllBlogs(
        sort?: string,
        limit?: number,
        category?: string,
        search?: string,
    ): Promise<Blog[]> {
        // Implement sorting, filtering, and searching logic here if needed
        return await this.blogsRepository.findAllBlogs();
    }
    async getAllPublishedBlogs(
        sort?: string,
        limit?: number,
        category?: string,
        search?: string,
    ): Promise<Blog[]> {
        // Implement logic to fetch only published blogs
        const blogs = await this.blogsRepository.findAllBlogs();
        return blogs.filter((blog) => blog.is_published);
    }
    async incrementBlogViewsBySlug(slug: string): Promise<void> {
        const blog = await this.blogsRepository.findOneBySlug(slug);
        if (!blog) {
            throw new NotFoundException('Blog not found');
        }
        blog.views = (blog.views || 0) + 1;
        await this.blogsRepository.save(blog);
    }
    async createBlog(createBlogDto: CreateBlogDto): Promise<Blog> {
        try {
            let thumbnailUrl: string | undefined;
            if (createBlogDto.thumbnail_image) {
                const uploadResult = await this.uploadService.uploadSingleFile(
                    createBlogDto.thumbnail_image.path,
                    createBlogDto.thumbnail_image.originalname,
                    createBlogDto.thumbnail_image.size,
                    createBlogDto.thumbnail_image.mimetype,
                );
                thumbnailUrl = uploadResult.url;
            }
            const newBlog = {
                ...createBlogDto,
                thumbnail_url: thumbnailUrl,
            };
            return await this.blogsRepository.createBlog(newBlog);
        } catch (error) {
            console.error('Error creating blog:', error);
            throw new Error('Failed to create blog');
        }
    }
    async updateBlogByUuid(uuid: string, updateBlogDto: UpdateBlogDto): Promise<Blog> {
        const blog = await this.blogsRepository.findOneByUuid(uuid);
        if (!blog) {
            throw new NotFoundException('Blog not found');
        }
        Object.assign(blog, updateBlogDto);
        return await this.blogsRepository.save(blog);
    }
    async deleteBlogByUuid(uuid: string): Promise<void> {
        const blog = await this.blogsRepository.findOneByUuid(uuid);
        if (!blog) {
            throw new NotFoundException('Blog not found');
        }
        await this.blogsRepository.remove(blog);
    }
    async getBlogByUuid(uuid: string): Promise<Blog> {
        const blog = await this.blogsRepository.findOneByUuid(uuid);
        if (!blog) {
            throw new NotFoundException('Blog not found');
        }
        return blog;
    }
    async getBlogBySlug(slug: string): Promise<Blog> {
        const blog = await this.blogsRepository.findOneBySlug(slug);
        if (!blog) {
            throw new NotFoundException('Blog not found');
        }
        return blog;
    }
    async getAllCategories(): Promise<any> {
        return await this.blogsRepository.findAllCategories();
    }

    async getCategoryById(id: number): Promise<any> {
        const category = await this.blogsRepository.findCategoryById(id);
        if (!category) {
            throw new NotFoundException('Category not found');
        }
        return category;
    }
}