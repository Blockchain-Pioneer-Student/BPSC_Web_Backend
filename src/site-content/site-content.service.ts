import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UpdateSiteContentDto } from './dto/update-site-content.dto';
import { SiteContent } from './entity/site-content.entity';
import { SITE_CONTENT_KEYS, type SiteContentKey } from './site-content.keys';
import { validateSiteContentValue } from './site-content.schema';

@Injectable()
export class SiteContentService {
  constructor(
    @InjectRepository(SiteContent)
    private readonly siteContentRepository: Repository<SiteContent>,
  ) {}

  private assertSupportedKey(key: string): void {
    if (!SITE_CONTENT_KEYS.includes(key as (typeof SITE_CONTENT_KEYS)[number])) {
      throw new BadRequestException(
        `Unsupported site content key: ${key}`,
      );
    }
  }

  async findAllPublic(): Promise<SiteContent[]> {
    const content = await this.siteContentRepository.find({
      where: { key: In([...SITE_CONTENT_KEYS]) },
      order: { key: 'ASC' },
    });

    return content.map((entry) => ({
      ...entry,
      value: entry.is_visible ? entry.value : {},
    }));
  }

  async findAllForAdmin(): Promise<SiteContent[]> {
    return this.siteContentRepository.find({
      where: { key: In([...SITE_CONTENT_KEYS]) },
      order: { key: 'ASC' },
    });
  }

  async findOnePublic(key: string): Promise<SiteContent> {
    this.assertSupportedKey(key);

    const content = await this.siteContentRepository.findOne({
      where: { key, is_visible: true },
    });

    if (!content) {
      throw new NotFoundException('Site content not found');
    }

    return content;
  }

  async upsert(
    key: string,
    updateSiteContentDto: UpdateSiteContentDto,
  ): Promise<SiteContent> {
    this.assertSupportedKey(key);
    validateSiteContentValue(
      key as SiteContentKey,
      updateSiteContentDto.value,
    );

    const existing = await this.siteContentRepository.findOne({
      where: { key },
    });

    if (existing) {
      existing.value = {
        ...existing.value,
        ...updateSiteContentDto.value,
      };

      if (updateSiteContentDto.is_visible !== undefined) {
        existing.is_visible = updateSiteContentDto.is_visible;
      }

      return this.siteContentRepository.save(existing);
    }

    const content = this.siteContentRepository.create({
      key,
      value: updateSiteContentDto.value,
      is_visible: updateSiteContentDto.is_visible ?? true,
    });

    return this.siteContentRepository.save(content);
  }
}
