/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadService } from '../shared/upload/upload.service';
import { CloudinaryConfig } from '../core/config/cloudinary.config';
import { AuthModule } from '../core/auth/auth.module';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { BlogsRepository } from './blogs.repository';
import { Blog } from './entity/blogs.entity';
import { BlogCategory } from './entity/blog_categories.entity';
import { BlogTag } from './entity/blog_tags.entity';
@Module({
    imports:[
        TypeOrmModule.forFeature([Blog, BlogCategory, BlogTag]),
        AuthModule,
    ],
    controllers: [BlogsController],
    providers: [BlogsService, BlogsRepository, UploadService, CloudinaryConfig],
    exports: [BlogsService, BlogsRepository
    ]
})
export class BlogsModule {}