/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Roles('admin')
  @Get()
  findAll() {
    return this.membersService.findAll();
  }

  @Public()
  @Get('get-all-active')
  findAllActive() {
    return this.membersService.findAllActive();
  }
}
