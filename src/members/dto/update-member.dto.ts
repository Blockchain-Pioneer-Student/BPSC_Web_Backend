import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class MemberSocialDto {
  @IsString()
  platform: string;

  @IsString()
  url: string;
}

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  full_name?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : Number(value),
  )
  board_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : Number(value),
  )
  role_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  role_name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? 0 : Number(value),
  )
  display_order?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberSocialDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as MemberSocialDto[];
      } catch {
        return [];
      }
    }
    return (value as MemberSocialDto[]) || [];
  })
  socials?: MemberSocialDto[];

  // File will be handled separately by multer
  image_file?: {
    path: string;
    originalname: string;
    size: number;
    mimetype: string;
  };
}