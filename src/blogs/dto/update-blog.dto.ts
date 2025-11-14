import {
  IsString,
  IsOptional,
  IsNumberString,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateBlogDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  thumbnail_url?: string;

  @IsString()
  @IsOptional()
  short_description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsNumberString()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '' || value === null) return undefined;
    if (typeof value === 'string') return parseInt(value, 10);
    return value as number;
  })
  category_id?: number;

  @IsString()
  @IsOptional()
  author?: string;

  @IsDateString()
  @IsOptional()
  published_at?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value as boolean | undefined;
  })
  @Type(() => Boolean)
  is_published?: boolean;

  @IsOptional()
  tags?: any[];

  @IsOptional()
  thumbnail_image?: {
    path: string;
    originalname: string;
    size: number;
    mimetype: string;
  };
}
