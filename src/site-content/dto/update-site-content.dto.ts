import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpdateSiteContentDto {
  @IsObject()
  value: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;
}
