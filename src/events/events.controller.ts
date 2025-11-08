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
import { Public } from '../auth/decorators/public.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
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

  @Public()
  @Get('categories')
  async getAllCategories(): Promise<EventCategory[]> {
    return await this.eventsService.getAllCategories();
  }

  @Public()
  @Get('categories/:id')
  async getCategoryById(@Param('id') id: string): Promise<EventCategory> {
    const categoryId = parseInt(id, 10);
    return await this.eventsService.getCategoryById(categoryId);
  }

  @Public()
  @Post('uuid/:uuid/views')
  async incrementViewsByUuid(@Param('uuid') uuid: string): Promise<{ message: string }> {
    await this.eventsService.incrementEventViewsByUuid(uuid);
    return { message: 'Views incremented successfully' };
  }

  @Public()
  @Post('uuid/:uuid/likes')
  async incrementLikesByUuid(@Param('uuid') uuid: string): Promise<{ message: string }> {
    await this.eventsService.incrementEventLikesByUuid(uuid);
    return { message: 'Likes incremented successfully' };
  }

  @Public()
  @Post('uuid/:uuid/comments')
  async incrementCommentsByUuid(@Param('uuid') uuid: string): Promise<{ message: string }> {
    await this.eventsService.incrementEventCommentsByUuid(uuid);
    return { message: 'Comments incremented successfully' };
  }

  @Post('backfill-uuids')
  @Roles('admin')
  async backfillEventUuids(): Promise<{ updated: number; message: string }> {
    return await this.eventsService.backfillEventUuids();
  }

  @Post('create')
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

  @Patch('update/:uuid')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('image_file', singleFileOptions))
  async updateEvent(
    @Param('uuid') uuid: string,
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
      const eventWithFile: UpdateEventDto = {
        ...updateEventDto,
        ...(image_file && { image_file }),
      };
      
      console.log('Updating event by UUID:', uuid, 'with data:', eventWithFile);
      
      const result = await this.eventsService.updateEventByUuid(
        uuid,
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

  
  @Delete('uuid/:uuid')
  @Roles('admin')
  async deleteEventByUuid(@Param('uuid') uuid: string): Promise<any> {
    try {
      console.log('Deleting event by UUID:', uuid);
      
      const result = await this.eventsService.deleteEventByUuid(uuid);
      return {
        success: true,
        message: 'Event deleted successfully',
        data: result,
      };
    } catch (error) {
      console.error('Error in deleteEventByUuid controller:', error);
      throw error;
    }
  }

  @Public()
  @Get('uuid/:uuid')
  async getEventByUuid(@Param('uuid') uuid: string): Promise<any> {
    return await this.eventsService.getEventByUuid(uuid);
  }

}
