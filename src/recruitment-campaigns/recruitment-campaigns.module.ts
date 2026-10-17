import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../core/auth/auth.module';
import { RecruitmentCampaign } from './entity/recruitment-campaign.entity';
import { RecruitmentCampaignsController } from './recruitment-campaigns.controller';
import { RecruitmentCampaignsService } from './recruitment-campaigns.service';

@Module({
  imports: [TypeOrmModule.forFeature([RecruitmentCampaign]), AuthModule],
  controllers: [RecruitmentCampaignsController],
  providers: [RecruitmentCampaignsService],
  exports: [RecruitmentCampaignsService, TypeOrmModule],
})
export class RecruitmentCampaignsModule {}
