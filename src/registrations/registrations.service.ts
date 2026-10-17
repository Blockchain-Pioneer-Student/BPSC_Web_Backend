/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Registration, RegistrationStatus } from './entity/registrations.entity';
import { RegistrationBlockchainArea } from './entity/registration_blockchain_areas.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { BlockchainArea } from '../blockchain_areas/entity/blockchain_areas.entity';
import {
  RecruitmentCampaign,
  RecruitmentCampaignStatus,
} from '../recruitment-campaigns/entity/recruitment-campaign.entity';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
    private readonly dataSource: DataSource,
  ) {}

  async createRegistration(
    dto: CreateRegistrationDto,
  ): Promise<Registration> {
    const {
      blockchain_area_ids,
      campaign_id: requestedCampaignId,
      ...registrationData
    } = dto;

    return this.dataSource.transaction(async (manager) => {
      const campaignRepository = manager.getRepository(RecruitmentCampaign);
      const areaRepository = manager.getRepository(BlockchainArea);
      const registrationRepository = manager.getRepository(Registration);
      const registrationAreaRepository =
        manager.getRepository(RegistrationBlockchainArea);

      const campaign = requestedCampaignId
        ? await campaignRepository
            .createQueryBuilder('campaign')
            .setLock('pessimistic_write')
            .where('campaign.id = :id', { id: requestedCampaignId })
            .getOne()
        : await this.findActiveCampaign(campaignRepository);

      if (!campaign) {
        throw new BadRequestException(
          requestedCampaignId
            ? 'Recruitment campaign not found'
            : 'Recruitment is currently closed',
        );
      }

      this.assertCampaignAcceptsInternalRegistration(campaign);

      const uniqueAreaIds = [...new Set(blockchain_area_ids)];
      if (uniqueAreaIds.length !== blockchain_area_ids.length) {
        throw new BadRequestException(
          'blockchain_area_ids must not contain duplicates',
        );
      }

      const areas = await areaRepository.findBy({
        id: In(uniqueAreaIds),
      });

      if (areas.length !== uniqueAreaIds.length) {
        throw new BadRequestException(
          'One or more blockchain area IDs are invalid',
        );
      }

      const registration = registrationRepository.create({
        ...registrationData,
        campaign_id: campaign.id,
      });
      const savedRegistration =
        await registrationRepository.save(registration);

      const registrationAreas = uniqueAreaIds.map((areaId) =>
        registrationAreaRepository.create({
          registration_id: savedRegistration.id,
          area_id: areaId,
        }),
      );

      await registrationAreaRepository.save(registrationAreas);

      return savedRegistration;
    });
  }

  async getAllRegistrations(): Promise<Registration[]> {
    return this.registrationRepository.find({
      relations: [
        'blockchainAreas',
        'blockchainAreas.blockchainArea',
        'campaign',
      ],
      order: {
        id: 'DESC',
      },
    });
  }

  async getRegistrationById(id: number): Promise<Registration> {
    const registration = await this.registrationRepository.findOne({
      where: { id },
      relations: [
        'blockchainAreas',
        'blockchainAreas.blockchainArea',
        'campaign',
      ],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration;
  }

  async updateRegistrationStatus(
    id: number,
    status: RegistrationStatus,
  ): Promise<Registration> {
    const registration = await this.getRegistrationById(id);
    registration.status = status;
    return this.registrationRepository.save(registration);
  }

  async deleteRegistration(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(RegistrationBlockchainArea).delete({
        registration_id: id,
      });

      const result = await manager.getRepository(Registration).delete(id);

      if (!result.affected) {
        throw new BadRequestException('Registration not found');
      }
    });
  }

  private async findActiveCampaign(
    repository: Repository<RecruitmentCampaign>,
  ): Promise<RecruitmentCampaign | null> {
    const now = new Date();

    return repository
      .createQueryBuilder('campaign')
      .setLock('pessimistic_write')
      .where('campaign.status = :status', {
        status: RecruitmentCampaignStatus.OPEN,
      })
      .andWhere('campaign.is_visible = TRUE')
      .andWhere('(campaign.opens_at IS NULL OR campaign.opens_at <= :now)', {
        now,
      })
      .andWhere('(campaign.closes_at IS NULL OR campaign.closes_at >= :now)', {
        now,
      })
      .getOne();
  }

  private assertCampaignAcceptsInternalRegistration(
    campaign: RecruitmentCampaign,
  ): void {
    const now = new Date();
    const isOpen =
      campaign.status === RecruitmentCampaignStatus.OPEN &&
      campaign.is_visible &&
      (!campaign.opens_at || campaign.opens_at <= now) &&
      (!campaign.closes_at || campaign.closes_at >= now);

    if (!isOpen) {
      throw new BadRequestException('Recruitment campaign is not open');
    }

    if (campaign.external_form_url) {
      throw new BadRequestException(
        'This recruitment campaign only accepts applications through its external form',
      );
    }
  }
}
