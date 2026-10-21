/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint eslint-disable @typescript-eslint/no-unsafe-member-access */
import { CreateEventDto } from './create-event.dto';
import { UpdateEventDto } from './update-event.dto';

function parseJsonArray(value: unknown, fallback: any[] | undefined): any[] | undefined {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === '') return fallback;
  return JSON.parse(String(value));
}

export function parseEventFormData(
  data: any,
  image_file?: any,
  speaker_avatar_images?: any[],
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
    schedules: parseJsonArray(data.schedules, []),
    speakers: parseJsonArray(data.speakers, []),
    image_file,
    speaker_avatar_images,
    speaker_avatar_mapping: parseJsonArray(data.speaker_avatar_mapping, undefined),
  };
}

export function parseEventUpdateFormData(
  data: any,
  image_file?: any,
  speaker_avatar_images?: any[],
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
    image: data.image,
    is_visible: data.is_visible,
    category_id: data.category_id,
    schedules: parseJsonArray(data.schedules, undefined),
    speakers: parseJsonArray(data.speakers, undefined),
    image_file,
    speaker_avatar_images,
    speaker_avatar_mapping: parseJsonArray(data.speaker_avatar_mapping, undefined),
  };
}
