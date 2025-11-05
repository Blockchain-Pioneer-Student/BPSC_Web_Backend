import {
  IsString,
  IsNotEmpty,
  Length,
  IsEmail,
  MinLength,
} from 'class-validator';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  full_name: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}