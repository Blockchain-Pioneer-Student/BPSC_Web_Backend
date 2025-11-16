/* eslint-disable prettier/prettier */
import { ScheduleDto } from "./schedule.dto";
import { SpeakerDto } from "./speaker.dto";

export class ActiveEventDto {
  event_uuid: string;
  slug: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  excerpt?: string;
  image?: string;
  views: number;
  likes: number;
  comments: number;
  status: string;
  registration_link?: string;
  notion_content?: string;
  is_visible: boolean;

  category?: {
    name: string;
  };

  schedules?: ScheduleDto[];
  speakers?: SpeakerDto[];
}
