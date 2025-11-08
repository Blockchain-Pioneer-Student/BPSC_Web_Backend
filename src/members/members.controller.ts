/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
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
  findAll(
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.membersService.findAll();
  }

  @Public()
  @Get('get-all-active')
  findAllActive() {
    return this.membersService.findAllActive();
  }

  @Roles('admin')
  @Get('roles')
  findAllRoles() {
    // For now, return empty array or implement in service later
    return [];
  }

  @Roles('admin')
  @Get(':id')
  findById(@Param('id') id: string) {
    const memberId = parseInt(id, 10);
    return this.membersService.findById(memberId);
  }

  @Roles('admin')
  @Patch(':id')
  updateById(@Param('id') id: string, @Body() updateData: any) {
    const memberId = parseInt(id, 10);
    return this.membersService.update(memberId, updateData);
  }

  @Roles('admin')
  @Delete(':id')
  deleteById(@Param('id') id: string) {
    const memberId = parseInt(id, 10);
    return this.membersService.delete(memberId);
  }
}
