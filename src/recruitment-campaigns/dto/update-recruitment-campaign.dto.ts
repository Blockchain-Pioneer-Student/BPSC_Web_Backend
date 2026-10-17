import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { RecruitmentCampaignStatus } from '../entity/recruitment-campaign.entity';

export class UpdateRecruitmentCampaignDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must contain lowercase letters, numbers, and single hyphens only',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsDateString()
  opens_at?: string | null;

  @IsOptional()
  @IsDateString()
  closes_at?: string | null;

  @IsOptional()
  @IsEnum(RecruitmentCampaignStatus)
  status?: RecruitmentCampaignStatus;

  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  external_form_url?: string | null;
}
