import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
  IsInt,
  Min,
} from 'class-validator';
import { PartnerStatus, PartnerType } from '../entity/partners.entity';

export class UpdatePartnerDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsEnum(PartnerType)
  type?: PartnerType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @IsUrl({ require_protocol: true })
  website?: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;

  @IsOptional()
  @IsEnum(PartnerStatus)
  status?: PartnerStatus;
}
