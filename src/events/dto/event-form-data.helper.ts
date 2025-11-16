/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { CreateEventDto } from './create-event.dto';
import { UpdateEventDto } from './update-event.dto';

export function parseEventFormData(
  data: any,
  image_file?: any,
): CreateEventDto {
  return {
    title: data.title,
    slug: data.slug,
    date: data.date,
    time: data.time,
    location: data.location,
    excerpt: data.excerpt,
    registration_link: data.registration_link,
    notion_content: data.notion_content,
    is_visible: data.is_visible,
    category_id: data.category_id,
    schedules: data.schedules ? JSON.parse(String(data.schedules)) : [],
    speakers: data.speakers ? JSON.parse(String(data.speakers)) : [],
    image_file,
  };
}

export function parseEventUpdateFormData(
  data: any,
  image_file?: any,
): UpdateEventDto {
  return {
    title: data.title,
    slug: data.slug,
    date: data.date,
    time: data.time,
    location: data.location,
    excerpt: data.excerpt,
    registration_link: data.registration_link,
    notion_content: data.notion_content,
    is_visible: data.is_visible,
    category_id: data.category_id,
    schedules: data.schedules ? JSON.parse(String(data.schedules)) : undefined,
    speakers: data.speakers ? JSON.parse(String(data.speakers)) : undefined,
    image_file,
  };
}