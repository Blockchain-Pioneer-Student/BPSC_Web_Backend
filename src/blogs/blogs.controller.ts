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
import { Blog } from './entity/blogs.entity';
import { parseBlogFormData } from './dto/blog-form-data.helper';
import { PublishedBlogDto } from './dto/published-blog.dto';
@Controller('blogs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) { }

  @Get('get-all')
  @Roles('admin')
  async getAllBlogs(
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ): Promise<Blog[]> {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return await this.blogsService.getAllBlogs(sort, limitNum, category, search);
  }

  @Public()
  @Get('get-all-published')
  async getAllPublishedBlogs(
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ): Promise<PublishedBlogDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return await this.blogsService.getAllPublishedBlogs(
      sort,
      limitNum,
      category,
      search,
    );
  }

  @Public()
  @Post('slug/:slug/views')
  async incrementViewsBySlug(@Param('slug') slug: string): Promise<{ message: string }> {
    await this.blogsService.incrementBlogViewsBySlug(slug);
    return { message: 'Views incremented successfully' };
  }

  @Post('create')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('thumbnail_image', singleFileOptions))
  async createBlog(
    @Body() body: any,
    @UploadedFile()
    thumbnail_image?: {
      path: string;
      originalname: string;
      size: number;
      mimetype: string;
    },
  ): Promise<any> {
    const createBlogDto = parseBlogFormData(body, thumbnail_image);
    return await this.blogsService.createBlog(createBlogDto);
  }

  @Patch('update/:uuid')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('thumbnail_image', singleFileOptions))
  async updateBlog(
    @Param('uuid') uuid: string,
    @Body() body: any,
    @UploadedFile()
    thumbnail_image?: {
      path: string;
      originalname: string;
      size: number;
      mimetype: string;
    },
  ): Promise<any> {
    const updateBlogDto = parseBlogFormData(body, thumbnail_image);
    return await this.blogsService.updateBlogByUuid(uuid, updateBlogDto);
  }

  @Delete('uuid/:uuid')
  @Roles('admin')
  async deleteBlogByUuid(@Param('uuid') uuid: string): Promise<any> {
    return await this.blogsService.deleteBlogByUuid(uuid);
  }

  @Public()
  @Get('uuid/:uuid')
  async getBlogByUuid(@Param('uuid') uuid: string): Promise<any> {
    return await this.blogsService.getBlogByUuid(uuid);
  }

  @Public()
  @Get('slug/:slug')
  async getBlogBySlug(@Param('slug') slug: string): Promise<any> {
    return await this.blogsService.getBlogBySlug(slug);
  }

  @Public()
  @Get('categories')
  async getAllCategories(): Promise<any> {
    return await this.blogsService.getAllCategories();
  }

  @Public()
  @Get('categories/:id')
  async getCategoryById(@Param('id') id: string): Promise<any> {
    const categoryId = parseInt(id, 10);
    return await this.blogsService.getCategoryById(categoryId);
  }

  @Get('uuid/:uuid/tags')
  @Roles('admin')
  async getTagsByBlogUuid(@Param('uuid') uuid: string): Promise<any> {
    return await this.blogsService.getTagsByBlogUuid(uuid);
  }

  @Public()
  @Get('by-tags')
  async getBlogsByTags(@Query('tags') tags: string): Promise<any> {
    const tagNames = tags ? tags.split(',').map(t => t.trim()) : [];
    return await this.blogsService.getBlogsByTags(tagNames);
  }

  @Public()
  @Get('tags')
  async getAllTags(): Promise<any> {
    return await this.blogsService.getAllTags();
  }
}