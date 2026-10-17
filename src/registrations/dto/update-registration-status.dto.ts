import { IsEnum } from 'class-validator';
import { RegistrationStatus } from '../entity/registrations.entity';

export class UpdateRegistrationStatusDto {
  @IsEnum(RegistrationStatus)
  status: RegistrationStatus;
}
