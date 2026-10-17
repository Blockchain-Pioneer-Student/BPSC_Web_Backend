import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Registration } from '../../registrations/entity/registrations.entity';

export enum RecruitmentCampaignStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

@Entity('recruitment_campaigns')
export class RecruitmentCampaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  opens_at?: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  closes_at?: Date | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: RecruitmentCampaignStatus.DRAFT,
  })
  status: RecruitmentCampaignStatus;

  @Column({ type: 'boolean', default: false })
  has_been_published: boolean;

  @Column({ type: 'boolean', default: true })
  is_visible: boolean;

  @Column({ type: 'text', nullable: true })
  external_form_url?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Registration, (registration) => registration.campaign)
  registrations: Registration[];
}
