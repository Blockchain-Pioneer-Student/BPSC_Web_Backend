import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateBoardDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}