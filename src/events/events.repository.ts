/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomUUID } from 'crypto';
import { Event } from './entity/events.entity';
import { EventCategory } from './entity/event_categories.entity';
import { EventSchedule } from './entity/event_schedules.entity';
import { EventSpeaker } from './entity/event_speakers.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

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

  async findAllActiveEvents(
    sort?: string,
    limit?: number,
    category?: string,
    search?: string,
  ): Promise<Event[]> {
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.category', 'category')
      .leftJoinAndSelect('event.schedules', 'schedules')
      .leftJoinAndSelect('event.speakers', 'speakers')
      .where('event.is_visible = :v', { v: true });

    if (category?.trim()) {
      qb.andWhere('category.name = :category', { category });
    }

    if (search?.trim()) {
      qb.andWhere(`
      LOWER(event.title) LIKE LOWER(:s) 
      OR LOWER(event.excerpt) LIKE LOWER(:s) 
      OR LOWER(event.location) LIKE LOWER(:s)
    `, { s: `%${search}%` });
    }

    // Sorting
    const allowed = ['views', 'likes', 'comments', 'created_at', 'updated_at', 'date', 'title'];
    if (sort) {
      const [field, order] = sort.split('_');
      qb.orderBy(
        allowed.includes(field) ? `event.${field}` : 'event.created_at',
        order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
      );
    } else {
      qb.orderBy('event.created_at', 'DESC'); // Default sorting by created_at
    }

    // Apply limit to ensure enough events are fetched
    if (limit && limit > 0) {
      qb.take(limit); // Use take instead of limit for better compatibility
    }

    return await qb.getMany();
  }

  async findEventById(id: number): Promise<Event | null> {
    return await this.eventRepository.findOne({
      where: { id },
      relations: ['category']
    });
  }

  async findEventByUuid(event_uuid: string): Promise<Event | null> {
    return await this.eventRepository.findOne({
      where: { event_uuid },
      relations: ['category']
    });
  }

  async findEventBySlug(slug: string): Promise<Event | null> {
    return await this.eventRepository.findOne({
      where: { slug },
      relations: ['category', 'schedules', 'speakers'],
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

    // Create event data without relations
    const { schedules: _, speakers: __, image_file: ___, ...eventData } = dto;

    const event = this.eventRepository.create({
      ...eventData,
      event_uuid: randomUUID(),
    });

    const savedEvent = await this.eventRepository.save(event);

    // Handle schedules creation
    if (schedules.length > 0) {
      const scheduleEntities = schedules.map(schedule =>
        this.eventScheduleRepository.create({
          ...schedule,
          event: savedEvent,
          event_id: savedEvent.id,
        })
      );
      await this.eventScheduleRepository.save(scheduleEntities);
    }

    // Handle speakers creation
    if (speakers.length > 0) {
      const speakerEntities = speakers.map(speaker =>
        this.eventSpeakerRepository.create({
          ...speaker,
          event: savedEvent,
          event_id: savedEvent.id,
        })
      );
      await this.eventSpeakerRepository.save(speakerEntities);
    }

    return savedEvent;
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
        await this.eventScheduleRepository.delete({ event_id: id });

        // Then create new schedules if any
        if (schedules && schedules.length > 0) {
          const parsedSchedules = typeof schedules === 'string' ? JSON.parse(schedules) : schedules;
          const scheduleEntities = parsedSchedules.map(schedule =>
            this.eventScheduleRepository.create({
              ...schedule,
              event_id: id,
              event: { id } as Event,
            })
          );
          await this.eventScheduleRepository.save(scheduleEntities);
        }
      }

      // Handle speakers update
      if (speakers !== undefined) {
        // First, delete existing speakers for this event
        await this.eventSpeakerRepository.delete({ event_id: id });

        // Then create new speakers if any
        if (speakers && speakers.length > 0) {
          const parsedSpeakers = typeof speakers === 'string' ? JSON.parse(speakers) : speakers;
          const speakerEntities = parsedSpeakers.map(speaker =>
            this.eventSpeakerRepository.create({
              ...speaker,
              event_id: id,
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

  async backfillUuids(): Promise<{ updated: number; message: string }> {
    // Find all events without UUID
    const eventsWithoutUuid = await this.eventRepository.find({
      where: { event_uuid: IsNull() }
    });

    if (eventsWithoutUuid.length === 0) {
      return { updated: 0, message: 'No events need UUID backfill' };
    }

    // Update each event with a new UUID
    for (const event of eventsWithoutUuid) {
      await this.eventRepository.update(event.id, {
        event_uuid: randomUUID()
      });
    }

    return {
      updated: eventsWithoutUuid.length,
      message: `Successfully updated ${eventsWithoutUuid.length} events with UUIDs`
    };
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

  // Delete methods for related entities
  async deleteEventSchedules(eventId: number): Promise<void> {
    await this.eventScheduleRepository.delete({ event_id: eventId });
  }

  async deleteEventSpeakers(eventId: number): Promise<void> {
    await this.eventSpeakerRepository.delete({ event_id: eventId });
  }
}
