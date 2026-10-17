import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
  IsInt,
  Min,
} from 'class-validator';
import { PartnerStatus, PartnerType } from '../entity/partners.entity';

export class CreatePartnerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  logo: string;

  @IsEnum(PartnerType)
  type: PartnerType;

  @IsString()
  @IsNotEmpty()
  description: string;

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
