import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { Partner, PartnerStatus } from './entity/partners.entity';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
  ) {}

  async getAllPartners(): Promise<Partner[]> {
    return this.partnerRepository.find({
      where: { status: PartnerStatus.ACTIVE },
      order: {
        display_order: 'ASC',
        name: 'ASC',
      },
    });
  }

  async getAllPartnersForAdmin(): Promise<Partner[]> {
    return this.partnerRepository.find({
      order: {
        display_order: 'ASC',
        name: 'ASC',
      },
    });
  }

  async getPartnerById(id: number): Promise<Partner> {
    const partner = await this.partnerRepository.findOne({ where: { id } });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    return partner;
  }

  async createPartner(createPartnerDto: CreatePartnerDto): Promise<Partner> {
    const partner = this.partnerRepository.create(createPartnerDto);
    return this.partnerRepository.save(partner);
  }

  async updatePartner(
    id: number,
    updatePartnerDto: UpdatePartnerDto,
  ): Promise<Partner> {
    const partner = await this.partnerRepository.preload({
      id,
      ...updatePartnerDto,
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    return this.partnerRepository.save(partner);
  }

  async deletePartner(id: number): Promise<void> {
    const result = await this.partnerRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Partner not found');
    }
  }
}
