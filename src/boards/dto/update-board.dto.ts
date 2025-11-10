import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}