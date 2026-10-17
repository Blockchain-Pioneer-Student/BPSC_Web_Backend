import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/auth/guards/roles.guard';
import { Public } from '../core/auth/decorators/public.decorator';
import { Roles } from '../core/auth/decorators/roles.decorator';
import { UpdateSiteContentDto } from './dto/update-site-content.dto';
import { SiteContentService } from './site-content.service';

@Controller('site-content')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SiteContentController {
  constructor(private readonly siteContentService: SiteContentService) {}

  @Get('admin/all')
  @Roles('admin')
  findAllForAdmin() {
    return this.siteContentService.findAllForAdmin();
  }

  @Public()
  @Get()
  findAllPublic() {
    return this.siteContentService.findAllPublic();
  }

  @Public()
  @Get(':key')
  findOnePublic(@Param('key') key: string) {
    return this.siteContentService.findOnePublic(key);
  }

  @Put(':key')
  @Roles('admin')
  upsert(
    @Param('key') key: string,
    @Body() updateSiteContentDto: UpdateSiteContentDto,
  ) {
    return this.siteContentService.upsert(key, updateSiteContentDto);
  }
}
