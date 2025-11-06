import { IsString, IsEmail, IsOptional, IsNumber, IsArray, ArrayMinSize, ArrayMaxSize, MinLength, MaxLength } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  full_name: string;

  @IsString()
  @MinLength(5)
  @MaxLength(50)
  student_id: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone_number?: string;

  @IsString()
  @MaxLength(255)
  university: string;

  @IsString()
  @MaxLength(255)
  major: string;

  @IsNumber()
  year_of_study: number;

  @IsString()
  @MaxLength(150)
  division: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  blockchain_experience?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsNumber({}, { each: true })
  blockchain_area_ids: number[];
}