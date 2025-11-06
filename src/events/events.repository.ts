/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entity/events.entity';
import { EventCategory } from './entity/event_categories.entity';
import { EventSchedule } from './entity/event_schedules.entity';
import { EventSpeaker } from './entity/event_speakers.entity';
import { CreateEventDto, UpdateEventDto } from './interface/create-event.interface' // Import the CreateEventData DTO

// Extend the Event type to include optional speakers and schedules
@Injectable()
export class EventsRepository {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventCategory)
    private readonly eventCategoryRepository: Repository<EventCategory>,
    @InjectRepository(EventSchedule)
    private readonly eventScheduleRepository: Repository<EventSchedule>,
    @InjectRepository(EventSpeaker)
    private readonly eventSpeakerRepository: Repository<EventSpeaker>,
  ) { }

  async findAllEvents(
    sort?: string,
    limit?: number,
    category?: string,
    search?: string,
  ): Promise<Event[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.category', 'category');

    // Handle category filter - using the new relationship
    if (category && category.trim() !== '') {
      queryBuilder.andWhere('category.name = :category', { category });
    }

    // Handle search filter
    if (search && search.trim() !== '') {
      queryBuilder.andWhere(
        '(LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.excerpt) LIKE LOWER(:search) OR LOWER(event.location) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Handle sorting
    if (sort) {
      const [field, order] = sort.split('_');
      const orderDirection = order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      // Validate field exists in entity
      const allowedFields = [
        'views',
        'likes',
        'comments',
        'created_at',
        'updated_at',
        'date',
        'title',
      ];
      if (allowedFields.includes(field)) {
        queryBuilder.orderBy(`event.${field}`, orderDirection);
      } else {
        // Default sort by created_at DESC if invalid field
        queryBuilder.orderBy('event.created_at', 'DESC');
      }
    } else {
      // Default sort by created_at DESC
      queryBuilder.orderBy('event.created_at', 'DESC');
    }

    // Handle limit
    if (limit && limit > 0) {
      queryBuilder.limit(limit);
    }

    return await queryBuilder.getMany();
  }

  async findEventById(id: number): Promise<Event | null> {
    return await this.eventRepository.findOne({
      where: { id },
      relations: ['category']
    });
  }

  async findEventSchedulesByEventId(eventId: number): Promise<EventSchedule[]> {
    return await this.eventScheduleRepository.find({
      where: { event_id: eventId },
      order: { time: 'ASC' }
    });
  }

  async findEventSpeakersByEventId(eventId: number): Promise<EventSpeaker[]> {
    return await this.eventSpeakerRepository.find({
      where: { event_id: eventId }
    });
  }

  async findAllCategories(): Promise<EventCategory[]> {
    return await this.eventCategoryRepository.find({
      order: { name: 'ASC' }
    });
  }

  async findCategoryById(id: number): Promise<EventCategory | null> {
    return await this.eventCategoryRepository.findOne({
      where: { id }
    });
  }

  async findCategoryByName(name: string): Promise<EventCategory | null> {
    return await this.eventCategoryRepository.findOne({
      where: { name }
    });
  }

  async createEvent(dto: CreateEventDto): Promise<Event> {
    const schedules = typeof dto.schedules === 'string' ? JSON.parse(dto.schedules) : (dto.schedules ?? []);
    const speakers = typeof dto.speakers === 'string' ? JSON.parse(dto.speakers) : (dto.speakers ?? []);

    const event = this.eventRepository.create({
      ...dto,
      schedules,
      speakers,
    });

    return await this.eventRepository.save(event);
  }

  async updateEvent(id: number, dto: UpdateEventDto): Promise<Event | null> {
    try {
      // Separate relational data from basic fields
      const { schedules, speakers, image_file, ...basicFields } = dto;
      
      // Update basic fields first (excluding relations and files)
      if (Object.keys(basicFields).length > 0) {
        await this.eventRepository.update(id, basicFields);
      }

      // Handle schedules update
      if (schedules !== undefined) {
        // First, delete existing schedules for this event
        await this.eventScheduleRepository.delete({ event: { id } });
        
        // Then create new schedules if any
        if (schedules.length > 0) {
          const parsedSchedules = typeof schedules === 'string' ? JSON.parse(schedules) : schedules;
          const scheduleEntities = parsedSchedules.map(schedule => 
            this.eventScheduleRepository.create({
              ...schedule,
              event: { id } as Event,
            })
          );
          await this.eventScheduleRepository.save(scheduleEntities);
        }
      }

      // Handle speakers update
      if (speakers !== undefined) {
        // First, delete existing speakers for this event
        await this.eventSpeakerRepository.delete({ event: { id } });
        
        // Then create new speakers if any
        if (speakers.length > 0) {
          const parsedSpeakers = typeof speakers === 'string' ? JSON.parse(speakers) : speakers;
          const speakerEntities = parsedSpeakers.map(speaker => 
            this.eventSpeakerRepository.create({
              ...speaker,
              event: { id } as Event,
            })
          );
          await this.eventSpeakerRepository.save(speakerEntities);
        }
      }
      
      return await this.findEventById(id);
    } catch (error) {
      console.error('Error in updateEvent:', error);
      throw error;
    }
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await this.eventRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async createCategory(categoryData: Partial<EventCategory>): Promise<EventCategory> {
    const category = this.eventCategoryRepository.create(categoryData);
    return await this.eventCategoryRepository.save(category);
  }

  async updateCategory(id: number, categoryData: Partial<EventCategory>): Promise<EventCategory | null> {
    await this.eventCategoryRepository.update(id, categoryData);
    return await this.findCategoryById(id);
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await this.eventCategoryRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async createSchedule(scheduleData: Partial<EventSchedule>): Promise<EventSchedule> {
    const schedule = this.eventScheduleRepository.create(scheduleData);
    return await this.eventScheduleRepository.save(schedule);
  }

  async updateSchedule(id: number, scheduleData: Partial<EventSchedule>): Promise<EventSchedule | null> {
    await this.eventScheduleRepository.update(id, scheduleData);
    const schedule = await this.eventScheduleRepository.findOne({ where: { id } });
    return schedule || null;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    const result = await this.eventScheduleRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async createSpeaker(speakerData: Partial<EventSpeaker>): Promise<EventSpeaker> {
    const speaker = this.eventSpeakerRepository.create(speakerData);
    return await this.eventSpeakerRepository.save(speaker);
  }

  async updateSpeaker(id: number, speakerData: Partial<EventSpeaker>): Promise<EventSpeaker | null> {
    await this.eventSpeakerRepository.update(id, speakerData);
    const speaker = await this.eventSpeakerRepository.findOne({ where: { id } });
    return speaker || null;
  }

  async deleteSpeaker(id: number): Promise<boolean> {
    const result = await this.eventSpeakerRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async incrementViews(id: number): Promise<void> {
    await this.eventRepository.increment({ id }, 'views', 1);
  }

  async incrementLikes(id: number): Promise<void> {
    await this.eventRepository.increment({ id }, 'likes', 1);
  }

  async incrementComments(id: number): Promise<void> {
    await this.eventRepository.increment({ id }, 'comments', 1);
  }

  // Delete methods for related entities
  async deleteEventSchedules(eventId: number): Promise<void> {
    await this.eventScheduleRepository.delete({ event_id: eventId });
  }

  async deleteEventSpeakers(eventId: number): Promise<void> {
    await this.eventSpeakerRepository.delete({ event_id: eventId });
  }
}
