import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../core/auth/decorators/public.decorator';
import { Roles } from '../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/auth/guards/roles.guard';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { Partner } from './entity/partners.entity';
import { PartnersService } from './partners.service';

@Controller('partners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Public()
  @Get('get-all')
  getAllPartners(): Promise<Partner[]> {
    return this.partnersService.getAllPartners();
  }

  @Roles('admin')
  @Get('admin/all')
  getAllPartnersForAdmin(): Promise<Partner[]> {
    return this.partnersService.getAllPartnersForAdmin();
  }

  @Roles('admin')
  @Get(':id')
  getPartnerById(@Param('id', ParseIntPipe) id: number): Promise<Partner> {
    return this.partnersService.getPartnerById(id);
  }

  @Roles('admin')
  @Post()
  createPartner(@Body() createPartnerDto: CreatePartnerDto): Promise<Partner> {
    return this.partnersService.createPartner(createPartnerDto);
  }

  @Roles('admin')
  @Patch(':id')
  updatePartner(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePartnerDto: UpdatePartnerDto,
  ): Promise<Partner> {
    return this.partnersService.updatePartner(id, updatePartnerDto);
  }

  @Roles('admin')
  @Delete(':id')
  async deletePartner(@Param('id', ParseIntPipe) id: number) {
    await this.partnersService.deletePartner(id);
    return { success: true };
  }
}
