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
    ) {}
    async getAllBlogs(): Promise<any[]> {
        return await this.blogsRepository.findAllBlogs();
    }
}