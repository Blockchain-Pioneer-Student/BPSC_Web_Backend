import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../core/auth/auth.module';
import { SiteContentController } from './site-content.controller';
import { SiteContent } from './entity/site-content.entity';
import { SiteContentService } from './site-content.service';

@Module({
  imports: [TypeOrmModule.forFeature([SiteContent]), AuthModule],
  controllers: [SiteContentController],
  providers: [SiteContentService],
  exports: [SiteContentService],
})
export class SiteContentModule {}
