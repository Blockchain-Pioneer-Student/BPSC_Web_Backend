import {
  IsString,
  IsOptional,
  IsNumberString,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  registration_link?: string;

  @IsString()
  @IsOptional()
  notion_content?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value as boolean | undefined;
  })
  @Type(() => Boolean)
  is_visible?: boolean;

  @IsNumberString()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '' || value === null) return undefined;
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value as number;
  })
  category_id?: number;

  @IsOptional()
  schedules?: any[];

  @IsOptional()
  speakers?: any[];

  @IsOptional()
  image_file?: {
    path: string;
    originalname: string;
    size: number;
    mimetype: string;
  };
}
