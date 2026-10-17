import { IsString, IsOptional, MaxLength, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  display_order?: number;

  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;
}