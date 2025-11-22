/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventsRepository } from './events.repository';
import { UploadService } from '../shared/upload/upload.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ActiveEventDto } from './dto/active-event.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly uploadService: UploadService,
  ) { }

  async getAllEvents(
    sort?: string,
    limit?: number,
    category?: string,
    search?: string,
  ): Promise<any[]> {
    return await this.eventsRepository.findAllEvents(sort, limit, category, search);
  }

  async getAllActiveEvents(
    sort?: string,
    limit?: number,
    category?: string,
    search?: string,
  ): Promise<ActiveEventDto[]> {
    const events = await this.eventsRepository.findAllActiveEvents(sort, limit, category, search);

    const formattedEvents: ActiveEventDto[] = [];

    for (const event of events) {
      const category = event.category_id
        ? await this.getCategoryById(event.category_id)
        : undefined;

      const formattedEvent: ActiveEventDto = {
        event_uuid: event.event_uuid,
        title: event.title,
        slug: event.slug,
        date: event.date.toString(),
        time: event.time || '', // Ensure time is always a string
        location: event.location,
        excerpt: event.excerpt,
        image: event.image,
        views: event.views,
        likes: event.likes,
        comments: event.comments,
        status: event.status || '', // Ensure status is always a string
        registration_link: event.registration_link,
        notion_content: event.notion_content,
        is_visible: event.is_visible,
        category: category
          ? {
            name: category.name,
          }
          : undefined,
        schedules: event.schedules?.map((schedule) => ({
          event_id: schedule.event_id,
          time: schedule.time || '', // Ensure time is always a string
          title: schedule.title,
          description: schedule.description,
          date: schedule.date,
          event: schedule.event,
        })),
        speakers: event.speakers?.map((speaker) => ({
          event_id: speaker.event_id,
          name: speaker.name,
          role: speaker.role,
          avatar_img: speaker.avatar_img,
          bio: speaker.bio,
          event: speaker.event,
        })),
      };

      formattedEvents.push(formattedEvent);
    }

    return formattedEvents;
  }


  async getEventByUuid(event_uuid: string): Promise<any> {
    // Find the event with category relation
    const event = await this.eventsRepository.findEventByUuid(event_uuid);

    if (!event) {
      throw new NotFoundException(`Event with UUID ${event_uuid} not found`);
    }

    // Get schedules and speakers using event ID
    const [schedules, speakers] = await Promise.all([
      this.eventsRepository.findEventSchedulesByEventId(event.id),
      this.eventsRepository.findEventSpeakersByEventId(event.id),
    ]);

    return {
      ...event,
      schedules: schedules,
      speakers: speakers,
    };
  }

  async getEventBySlug(slug: string): Promise<ActiveEventDto> {
    const event = await this.eventsRepository.findEventBySlug(slug);
    if (!event) {
      throw new NotFoundException(`Event with slug '${slug}' not found`);
    }

    const category = event.category_id
      ? await this.getCategoryById(event.category_id)
      : undefined;

    const formattedEvent: ActiveEventDto = {
      event_uuid: event.event_uuid,
      title: event.title,
      slug: event.slug,
      date: event.date.toString(),
      time: event.time || '', // Ensure time is always a string
      location: event.location,
      excerpt: event.excerpt,
      image: event.image,
      views: event.views,
      likes: event.likes,
      comments: event.comments,
      status: event.status || '', // Ensure status is always a string
      registration_link: event.registration_link,
      notion_content: event.notion_content,
      is_visible: event.is_visible,
      category: category
        ? {
          name: category.name,
        }
        : undefined,
      schedules: event.schedules?.map((schedule) => ({
        event_id: schedule.event_id,
        time: schedule.time || '', // Ensure time is always a string
        title: schedule.title,
        description: schedule.description,
        date: schedule.date,
        event: schedule.event,
      })),
      speakers: event.speakers?.map((speaker) => ({
        event_id: speaker.event_id,
        name: speaker.name,
        role: speaker.role,
        avatar_img: speaker.avatar_img,
        bio: speaker.bio,
        event: speaker.event,
      })),
    };

    return formattedEvent;
  }

  // Additional service methods using repository
  async getAllCategories(): Promise<any[]> {
    return await this.eventsRepository.findAllCategories();
  }

  async backfillEventUuids(): Promise<{ updated: number; message: string }> {
    return await this.eventsRepository.backfillUuids();
  }

  async getCategoryById(id: number): Promise<any> {
    const category = await this.eventsRepository.findCategoryById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async incrementEventViewsByUuid(event_uuid: string): Promise<void> {
    const event = await this.eventsRepository.findEventByUuid(event_uuid);
    if (!event) {
      throw new NotFoundException(`Event with UUID ${event_uuid} not found`);
    }
    await this.eventsRepository.incrementViews(event.id);
  }

  async incrementEventViewsBySlug(slug: string): Promise<void> {
    const event = await this.eventsRepository.findEventBySlug(slug);
    if (!event) {
      throw new NotFoundException(`Event with slug '${slug}' not found`);
    }
    await this.eventsRepository.incrementViews(event.id);
  }

  async createEvent(createEventDto: CreateEventDto): Promise<any> {
    try {
      let imageUrl: string | undefined;

      // If an image file is provided, upload it and get the URL
      if (createEventDto.image_file) {
        const uploadResult = await this.uploadService.uploadSingleFile(
          createEventDto.image_file.path,
          createEventDto.image_file.originalname,
          createEventDto.image_file.size,
          createEventDto.image_file.mimetype,
        );
        console.log(uploadResult);
        imageUrl = uploadResult.url;
      }

      // Handle speaker avatar images upload
      let speakers = createEventDto.speakers || [];
      if (createEventDto.speaker_avatar_images && createEventDto.speaker_avatar_images.length > 0) {
        // Upload all speaker avatar images
        const speakerAvatarFiles = createEventDto.speaker_avatar_images.map(file => ({
          path: file.path,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        }));

        const uploadedAvatars = await this.uploadService.uploadMultipleFiles(speakerAvatarFiles);

        // Use mapping if provided, otherwise assign by index
        if (createEventDto.speaker_avatar_mapping && createEventDto.speaker_avatar_mapping.length > 0) {
          // Assign uploaded avatar URLs to speakers using the mapping
          // Mapping can contain either speaker IDs (for updates) or indices (for creates)
          speakers = speakers.map((speaker: any, speakerIndex: number) => {
            // Try to find file index by matching speaker ID or index
            const speakerIdentifier = speaker.id ?? speakerIndex;
            const fileIndex = createEventDto.speaker_avatar_mapping!.indexOf(speakerIdentifier);

            if (fileIndex !== -1 && uploadedAvatars[fileIndex]) {
              return {
                ...speaker,
                avatar_img: uploadedAvatars[fileIndex].url,
              };
            }
            return speaker;
          });
        } else {
          // Fallback: Assign by index (old behavior)
          speakers = speakers.map((speaker: any, index: number) => {
            if (uploadedAvatars[index]) {
              return {
                ...speaker,
                avatar_img: uploadedAvatars[index].url,
              };
            }
            return speaker;
          });
        }
      }

      const newEvent = {
        ...createEventDto,
        image: imageUrl, // Use the uploaded image URL in a new property
        speakers, // Use updated speakers with avatar URLs
      };

      // Save the event to the repository
      return await this.eventsRepository.createEvent(newEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  }

  async updateEventByUuid(uuid: string, updateEventDto: UpdateEventDto): Promise<any> {
    try {
      // First find the event by UUID to get the ID
      const existingEvent = await this.eventsRepository.findEventByUuid(uuid);
      if (!existingEvent) {
        throw new NotFoundException(`Event with UUID ${uuid} not found`);
      }

      // Handle image upload if provided
      if (updateEventDto.image_file) {
        const uploadedImage = await this.uploadService.uploadSingleFile(
          updateEventDto.image_file.path,
          updateEventDto.image_file.originalname,
          updateEventDto.image_file.size,
          updateEventDto.image_file.mimetype,
        );
        (updateEventDto as any).image = uploadedImage.url;
      }

      // Handle speaker avatar images upload
      let speakers = updateEventDto.speakers;
      if (updateEventDto.speaker_avatar_images && updateEventDto.speaker_avatar_images.length > 0) {
        // If speakers aren't provided in the update payload, load existing speakers from DB
        if (!speakers) {
          speakers = await this.eventsRepository.findEventSpeakersByEventId(existingEvent.id);
        }

        if (speakers && speakers.length > 0) {
          // Upload all speaker avatar images
          const speakerAvatarFiles = updateEventDto.speaker_avatar_images.map(file => ({
            path: file.path,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
          }));

          const uploadedAvatars = await this.uploadService.uploadMultipleFiles(speakerAvatarFiles);

          // Use mapping if provided, otherwise assign by index
          if (updateEventDto.speaker_avatar_mapping && updateEventDto.speaker_avatar_mapping.length > 0) {
            // Assign uploaded avatar URLs to speakers using the mapping
            // Mapping can contain either speaker IDs (for updates) or indices (for creates)
            speakers = speakers.map((speaker: any, speakerIndex: number) => {
              // Try to find file index by matching speaker ID or index
              const speakerIdentifier = speaker.id ?? speakerIndex;
              const fileIndex = updateEventDto.speaker_avatar_mapping!.indexOf(speakerIdentifier);

              if (fileIndex !== -1 && uploadedAvatars[fileIndex]) {
                return {
                  ...speaker,
                  avatar_img: uploadedAvatars[fileIndex].url,
                };
              }
              return speaker;
            });
          } else {
            // Fallback: Assign by index (old behavior)
            speakers = speakers.map((speaker: any, index: number) => {
              if (uploadedAvatars[index]) {
                return {
                  ...speaker,
                  avatar_img: uploadedAvatars[index].url,
                };
              }
              return speaker;
            });
          }
        }
      }

      const updatedEvent = {
        ...updateEventDto,
        image_file: undefined, // Remove file from update data
        speaker_avatar_images: undefined, // Remove files from update data
        speaker_avatar_mapping: undefined, // Remove mapping from update data
        speakers, // Use updated speakers with avatar URLs
      };

      return await this.eventsRepository.updateEvent(existingEvent.id, updatedEvent);
    } catch (error) {
      console.error('Error updating event by UUID:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to update event');
    }
  }

  async deleteEventByUuid(uuid: string): Promise<any> {
    try {
      // First find the event by UUID to get the ID
      const existingEvent = await this.eventsRepository.findEventByUuid(uuid);
      if (!existingEvent) {
        throw new NotFoundException(`Event with UUID ${uuid} not found`);
      }

      // Delete related schedules and speakers first
      await Promise.all([
        this.eventsRepository.deleteEventSchedules(existingEvent.id),
        this.eventsRepository.deleteEventSpeakers(existingEvent.id),
      ]);

      // Delete the event
      const deleteResult = await this.eventsRepository.deleteEvent(existingEvent.id);

      if (!deleteResult) {
        throw new Error('Failed to delete event from database');
      }

      return {
        uuid: uuid,
        id: existingEvent.id,
        message: 'Event and related data deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting event by UUID:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to delete event');
    }
  }
}
