/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Query, Param, Post, Body ,Req, UploadedFile, UseInterceptors} from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './entity/events.entity';
import { EventCategory } from './entity/event_categories.entity';
import type { CreateEventDto } from './interface/create-event.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { singleFileOptions } from 'src/middleware/multer.middleware';
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  @Get('get-all')
  async getAllEvents(
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ): Promise<Event[]> {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return await this.eventsService.getAllEvents(
      sort,
      limitNum,
      category,
      search,
    );
  }

  @Get('categories')
  async getAllCategories(): Promise<EventCategory[]> {
    return await this.eventsService.getAllCategories();
  }

  @Get('categories/:id')
  async getCategoryById(@Param('id') id: string): Promise<EventCategory> {
    const categoryId = parseInt(id, 10);
    return await this.eventsService.getCategoryById(categoryId);
  }

  @Get(':id')
  async getEventById(@Param('id') id: string): Promise<any> {
    const eventId = parseInt(id, 10);
    return await this.eventsService.getEventById(eventId);
  }

  @Post(':id/views')
  async incrementViews(@Param('id') id: string): Promise<{ message: string }> {
    const eventId = parseInt(id, 10);
    await this.eventsService.incrementEventViews(eventId);
    return { message: 'Views incremented successfully' };
  }

  @Post(':id/likes')
  async incrementLikes(@Param('id') id: string): Promise<{ message: string }> {
    const eventId = parseInt(id, 10);
    await this.eventsService.incrementEventLikes(eventId);
    return { message: 'Likes incremented successfully' };
  }

  @Post(':id/comments')
  async incrementComments(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    const eventId = parseInt(id, 10);
    await this.eventsService.incrementEventComments(eventId);
    return { message: 'Comments incremented successfully' };
  }

  @Post('create')
  @UseInterceptors(FileInterceptor('image_file', singleFileOptions))
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @UploadedFile()
    image_file: {
      path: string;
      originalname: string;
      size: number;
      mimetype: string;
    },
  ): Promise<any> {
    const eventWithFile = { ...createEventDto, image_file };
    console.log(eventWithFile);
    return await this.eventsService.createEvent(eventWithFile);
  }
}
