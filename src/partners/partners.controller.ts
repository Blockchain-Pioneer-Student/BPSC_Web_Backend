import { Controller, Get } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { Partner } from './entity/partners.entity';

@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get('get-all')
  async getAllPartners(): Promise<Partner[]> {
    return await this.partnersService.getAllPartners();
  }
}
