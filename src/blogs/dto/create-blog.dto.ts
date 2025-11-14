/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumberString,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  thumbnail_url?: string;

  @IsString()
  @IsNotEmpty()
  short_description: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumberString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (value === undefined || value === '' || value === null) return undefined;
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  category_id: number;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsOptional()
  @IsDateString()
  published_at?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return false;
  })
  @Type(() => Boolean)
  is_published?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return [];
    return value;
  })
  tags?: string[];

  // CHANGED: image_file → thumbnail_image
  @IsOptional()
  thumbnail_image?: {
    path: string;
    originalname: string;
    size: number;
    mimetype: string;
  };
}
