import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRegistrationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  campaign_id?: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'full_name must not be blank' })
  @MinLength(2)
  @MaxLength(150)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  full_name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'student_id must contain letters and numbers only',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  student_id: string;

  @IsEmail()
  @MaxLength(150)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^(?=(?:\D*\d){8,15}\D*$)[0-9+\-\s()]+$/, {
    message: 'phone_number must contain 8 to 15 digits',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  phone_number?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'university must not be blank' })
  @MaxLength(255)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  university: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'major must not be blank' })
  @MaxLength(255)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  major: string;

  @IsInt()
  @Min(1)
  @Max(6)
  year_of_study: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'division must not be blank' })
  @MaxLength(150)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  division: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  blockchain_experience?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'reason must not be blank' })
  @MinLength(10)
  @MaxLength(1000)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsInt({ each: true })
  @Min(1, { each: true })
  blockchain_area_ids: number[];
}
