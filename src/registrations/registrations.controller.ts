/* eslint-disable prettier/prettier */
import { Controller, Post, Get, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Registration } from './entity/registrations.entity';
import { Public } from '../auth/decorators/public.decorator';

@Controller('registrations')
export class RegistrationsController {
  constructor(
    private readonly registrationsService: RegistrationsService,
  ) {}

  @Public()
  @Post('create')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createRegistration(
    @Body() createRegistrationDto: CreateRegistrationDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: Registration;
  }> {
    const registration = await this.registrationsService.createRegistration(
      createRegistrationDto,
    );

    return {
      success: true,
      message: 'Registration created successfully',
      data: registration,
    };
  }

  @Public()
  @Get('get-all')
  async getAllRegistrations(): Promise<{
    success: boolean;
    message: string;
    data: Registration[];
    count: number;
  }> {
    const registrations = await this.registrationsService.getAllRegistrations();

    return {
      success: true,
      message: 'Registrations retrieved successfully',
      data: registrations,
      count: registrations.length,
    };
  }
}