/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
import { EventsService } from './events.service';
import { Event } from './entity/events.entity';
import { EventCategory } from './entity/event_categories.entity';
import type { CreateEventDto, UpdateEventDto } from './interface/create-event.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { singleFileOptions } from 'src/middleware/multer.middleware';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
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
    // console.log(eventWithFile);
    return await this.eventsService.createEvent(eventWithFile);
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('image_file', singleFileOptions))
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @UploadedFile()
    image_file?: {
      path: string;
      originalname: string;
      size: number;
      mimetype: string;
    },
  ): Promise<any> {
    try {
      const eventId = parseInt(id, 10);
      const eventWithFile: UpdateEventDto = {
        ...updateEventDto,
        ...(image_file && { image_file }),
      };
      
      console.log('Updating event:', eventId, 'with data:', eventWithFile);
      
      const result = await this.eventsService.updateEvent(
        eventId,
        eventWithFile,
      );
      return {
        success: true,
        message: 'Event updated successfully',
        data: result,
      };
    } catch (error) {
      console.error('Error in updateEvent controller:', error);
      throw error;
    }
  }

  
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteEvent(@Param('id') id: string): Promise<any> {
    try {
      const eventId = parseInt(id, 10);
      
      console.log('Deleting event:', eventId);
      
      const result = await this.eventsService.deleteEvent(eventId);
      return {
        success: true,
        message: 'Event deleted successfully',
        data: result,
      };
    } catch (error) {
      console.error('Error in deleteEvent controller:', error);
      throw error;
    }
  }

  @Get(':id')
  async getEventById(@Param('id') id: string): Promise<any> {
    const eventId = parseInt(id, 10);
    return await this.eventsService.getEventById(eventId);
  }
}
