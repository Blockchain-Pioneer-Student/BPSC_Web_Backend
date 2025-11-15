/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { UploadService } from '../shared/upload/upload.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogsRepository } from './blogs.repository';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
@Injectable()
export class BlogsService {
    constructor(
        private readonly blogsRepository: BlogsRepository,
        private readonly uploadService: UploadService,
    ) { }
    async getAllBlogs(): Promise<any[]> {
        return await this.blogsRepository.findAllBlogs();
    }
    async createBlog(createBlogDto: CreateBlogDto): Promise<any> {
        try {
            let thumbnailUrl : string | undefined;
            if(createBlogDto.thumbnail_image) {
                const uploadResult = await this.uploadService.uploadSingleFile(
                    createBlogDto.thumbnail_image.path,
                    createBlogDto.thumbnail_image.originalname,
                    createBlogDto.thumbnail_image.size,
                    createBlogDto.thumbnail_image.mimetype,
                );
                console.log(uploadResult);
                thumbnailUrl = uploadResult.url;
            }
            const newBlog = {
                ...createBlogDto,
                thumbnail_url: thumbnailUrl,
            }
            return await this.blogsRepository.createBlog(newBlog);
        } catch (error) {
            console.error('Error creating blog:', error);
            throw new Error('Failed to create blog');
        }
    }
}