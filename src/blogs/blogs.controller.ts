/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Patch,
  Delete,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { singleFileOptions } from 'src/core/middleware/multer.middleware';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/auth/guards/roles.guard';
import { Roles } from '../core/auth/decorators/roles.decorator';
import { Public } from '../core/auth/decorators/public.decorator';
import { BlogsService } from './blogs.service';
import {Blog} from './entity/blogs.entity';

@Controller('blogs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlogsController{
    constructor(private readonly blogsService: BlogsService) {}

    @Get('get-all')
    @Roles('admin')
    async getAllBlogs(): Promise<Blog[]> {
        return await this.blogsService.getAllBlogs();
    }

    // @Public()
    // @Get('get-all-published')
    // async getAllPublishedBlogs(): Promise<Blog[]> {
    //     // return await this.blogsService.getAllPublishedBlogs();
    // }
}