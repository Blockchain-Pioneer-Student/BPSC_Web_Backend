/* eslint-disable prettier/prettier */
import { Controller, Post, Get, Delete, Body, Param, UsePipes, ValidationPipe, ParseIntPipe } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Registration } from './entity/registrations.entity';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
@UseGuards(JwtAuthGuard)
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

  @UseGuards(RolesGuard)
  @Roles('admin')
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

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async deleteRegistration(@Param('id', ParseIntPipe) id: number): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.registrationsService.deleteRegistration(id);

    return {
      success: true,
      message: 'Registration deleted successfully',
    };
  }
}