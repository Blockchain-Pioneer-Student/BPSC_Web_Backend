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
import { CreateRecruitmentCampaignDto } from './dto/create-recruitment-campaign.dto';
import { UpdateRecruitmentCampaignDto } from './dto/update-recruitment-campaign.dto';
import { RecruitmentCampaignsService } from './recruitment-campaigns.service';

@Controller('recruitment-campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecruitmentCampaignsController {
  constructor(
    private readonly recruitmentCampaignsService: RecruitmentCampaignsService,
  ) {}

  @Roles('admin')
  @Get()
  findAll() {
    return this.recruitmentCampaignsService.findAll();
  }

  @Public()
  @Get('active')
  findActive() {
    return this.recruitmentCampaignsService.findActive();
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.recruitmentCampaignsService.findBySlug(slug);
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateRecruitmentCampaignDto) {
    return this.recruitmentCampaignsService.create(dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecruitmentCampaignDto,
  ) {
    return this.recruitmentCampaignsService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.recruitmentCampaignsService.remove(id);
    return { success: true };
  }
}
