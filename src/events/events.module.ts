import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsRepository } from './events.repository';
import { Event } from './entity/events.entity';
import { EventCategory } from './entity/event_categories.entity';
import { EventSchedule } from './entity/event_schedules.entity';
import { EventSpeaker } from './entity/event_speakers.entity';
import { UploadService } from '../shared/upload/upload.service';
import { CloudinaryConfig } from '../core/config/cloudinary.config';
import { AuthModule } from '../core/auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventCategory,
      EventSchedule,
      EventSpeaker,
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository, UploadService, CloudinaryConfig],
  exports: [EventsService, EventsRepository],
})
export class EventsModule {}
