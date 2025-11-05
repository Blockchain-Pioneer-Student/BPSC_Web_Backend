export interface CreateEventDto {
  title: string;
  date: string;
  time?: string;
  location?: string;
  excerpt?: string;
  registration_link?: string;
  notion_content?: string;
  is_visible?: boolean;
  category_id?: number;
  schedules?: any[];
  speakers?: any[];
  image_file?: {
    path: string;
    originalname: string;
    size: number;
    mimetype: string;
  };
}