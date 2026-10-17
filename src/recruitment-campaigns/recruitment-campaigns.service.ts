import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Registration } from '../registrations/entity/registrations.entity';
import { CreateRecruitmentCampaignDto } from './dto/create-recruitment-campaign.dto';
import { UpdateRecruitmentCampaignDto } from './dto/update-recruitment-campaign.dto';
import {
  RecruitmentCampaign,
  RecruitmentCampaignStatus,
} from './entity/recruitment-campaign.entity';

@Injectable()
export class RecruitmentCampaignsService {
  constructor(
    @InjectRepository(RecruitmentCampaign)
    private readonly campaignRepository: Repository<RecruitmentCampaign>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<RecruitmentCampaign[]> {
    return this.campaignRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<RecruitmentCampaign> {
    const campaign = await this.campaignRepository.findOne({ where: { id } });

    if (!campaign) {
      throw new NotFoundException('Recruitment campaign not found');
    }

    return campaign;
  }

  async findActive(): Promise<RecruitmentCampaign | null> {
    return this.buildActiveQuery().getOne();
  }

  async findBySlug(slug: string): Promise<RecruitmentCampaign> {
    const campaign = await this.buildActiveQuery()
      .andWhere('campaign.slug = :slug', { slug })
      .getOne();

    if (!campaign) {
      throw new NotFoundException('Recruitment campaign not found');
    }

    return campaign;
  }

  async create(
    dto: CreateRecruitmentCampaignDto,
  ): Promise<RecruitmentCampaign> {
    const opensAt = dto.opens_at ? new Date(dto.opens_at) : null;
    const closesAt = dto.closes_at ? new Date(dto.closes_at) : null;

    this.assertValidDateRange(opensAt, closesAt);

    const status = dto.status ?? RecruitmentCampaignStatus.DRAFT;
    const isVisible = dto.is_visible ?? true;

    await this.assertSingleVisibleOpenCampaign(status, isVisible);

    const campaign = this.campaignRepository.create({
      ...dto,
      opens_at: opensAt,
      closes_at: closesAt,
      status,
      is_visible: isVisible,
      has_been_published: status !== RecruitmentCampaignStatus.DRAFT,
    });

    try {
      return await this.campaignRepository.save(campaign);
    } catch (error) {
      this.rethrowConstraintError(error);
    }
  }

  async update(
    id: number,
    dto: UpdateRecruitmentCampaignDto,
  ): Promise<RecruitmentCampaign> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RecruitmentCampaign);
      const campaign = await repository
        .createQueryBuilder('campaign')
        .setLock('pessimistic_write')
        .where('campaign.id = :id', { id })
        .getOne();

      if (!campaign) {
        throw new NotFoundException('Recruitment campaign not found');
      }

      const opensAt =
        dto.opens_at === undefined
          ? campaign.opens_at ?? null
          : dto.opens_at
            ? new Date(dto.opens_at)
            : null;
      const closesAt =
        dto.closes_at === undefined
          ? campaign.closes_at ?? null
          : dto.closes_at
            ? new Date(dto.closes_at)
            : null;

      this.assertValidDateRange(opensAt, closesAt);

      const nextStatus = dto.status ?? campaign.status;
      const nextVisible = dto.is_visible ?? campaign.is_visible;

      if (
        campaign.status !== RecruitmentCampaignStatus.DRAFT &&
        nextStatus === RecruitmentCampaignStatus.DRAFT
      ) {
        throw new ConflictException(
          'Campaigns that have left draft cannot return to draft. Archive them instead.',
        );
      }

      if (
        campaign.status === RecruitmentCampaignStatus.ARCHIVED &&
        nextStatus !== RecruitmentCampaignStatus.ARCHIVED
      ) {
        throw new ConflictException('Archived campaigns cannot be reopened');
      }

      await this.assertSingleVisibleOpenCampaign(
        nextStatus,
        nextVisible,
        campaign.id,
        repository,
      );

      Object.assign(campaign, {
        ...dto,
        opens_at: opensAt,
        closes_at: closesAt,
        has_been_published:
          campaign.has_been_published ||
          nextStatus !== RecruitmentCampaignStatus.DRAFT,
      });

      try {
        return await repository.save(campaign);
      } catch (error) {
        this.rethrowConstraintError(error);
      }
    });
  }

  async remove(id: number): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RecruitmentCampaign);
      const campaign = await repository
        .createQueryBuilder('campaign')
        .setLock('pessimistic_write')
        .where('campaign.id = :id', { id })
        .getOne();

      if (!campaign) {
        throw new NotFoundException('Recruitment campaign not found');
      }

      if (
        campaign.status !== RecruitmentCampaignStatus.DRAFT ||
        campaign.has_been_published
      ) {
        throw new ConflictException(
          'Only never-published draft campaigns can be deleted. Archive published campaigns instead.',
        );
      }

      const registrationCount = await manager
        .getRepository(Registration)
        .count({ where: { campaign_id: id } });

      if (registrationCount > 0) {
        throw new ConflictException(
          'Campaign has registrations and cannot be deleted. Archive it instead.',
        );
      }

      const result = await repository.delete(id);

      if (!result.affected) {
        throw new NotFoundException('Recruitment campaign not found');
      }
    });
  }

  private buildActiveQuery() {
    const now = new Date();

    return this.campaignRepository
      .createQueryBuilder('campaign')
      .where('campaign.status = :status', {
        status: RecruitmentCampaignStatus.OPEN,
      })
      .andWhere('campaign.is_visible = :isVisible', { isVisible: true })
      .andWhere('(campaign.opens_at IS NULL OR campaign.opens_at <= :now)', {
        now,
      })
      .andWhere('(campaign.closes_at IS NULL OR campaign.closes_at >= :now)', {
        now,
      })
      .orderBy('campaign.created_at', 'DESC');
  }

  private assertValidDateRange(
    opensAt: Date | null,
    closesAt: Date | null,
  ): void {
    if (opensAt && closesAt && opensAt.getTime() >= closesAt.getTime()) {
      throw new BadRequestException(
        'opens_at must be earlier than closes_at',
      );
    }
  }

  private async assertSingleVisibleOpenCampaign(
    status: RecruitmentCampaignStatus,
    isVisible: boolean,
    excludeId?: number,
    repository: Repository<RecruitmentCampaign> = this.campaignRepository,
  ): Promise<void> {
    if (status !== RecruitmentCampaignStatus.OPEN || !isVisible) {
      return;
    }

    const query = repository
      .createQueryBuilder('campaign')
      .where('campaign.status = :status', {
        status: RecruitmentCampaignStatus.OPEN,
      })
      .andWhere('campaign.is_visible = TRUE');

    if (excludeId) {
      query.andWhere('campaign.id != :excludeId', { excludeId });
    }

    const existing = await query.getOne();

    if (existing) {
      throw new ConflictException(
        'Only one visible open recruitment campaign is allowed at a time',
      );
    }
  }

  private rethrowConstraintError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = (
        error as QueryFailedError & {
          driverError?: { code?: string; constraint?: string };
        }
      ).driverError;

      if (driverError?.code === '23505') {
        throw new ConflictException(
          'Campaign slug must be unique and only one visible open campaign is allowed',
        );
      }

      if (driverError?.code === '23514') {
        throw new BadRequestException('Campaign data violates database constraints');
      }
    }

    throw error;
  }
}
