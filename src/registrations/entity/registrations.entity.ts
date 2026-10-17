import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RegistrationBlockchainArea } from './registration_blockchain_areas.entity';
import { RecruitmentCampaign } from '../../recruitment-campaigns/entity/recruitment-campaign.entity';

export enum RegistrationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_INFO = 'needs_info',
}

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, nullable: false })
  full_name: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  student_id: string;

  @Column({ type: 'varchar', length: 150, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_number?: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  university: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  major: string;

  @Column({ type: 'integer', nullable: false })
  year_of_study: number;

  @Column({ type: 'varchar', length: 150, nullable: false })
  division: string;

  @Column({ type: 'text', nullable: true })
  blockchain_experience?: string;

  @Column({ type: 'text', nullable: false })
  reason: string;

  @Column({ type: 'varchar', length: 30, default: RegistrationStatus.PENDING })
  status: RegistrationStatus;

  @Column({ type: 'integer', nullable: true })
  campaign_id?: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => RecruitmentCampaign, (campaign) => campaign.registrations, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign?: RecruitmentCampaign;

  // Relations
  @OneToMany(
    () => RegistrationBlockchainArea,
    (registrationBlockchainArea) => registrationBlockchainArea.registration,
    { cascade: true },
  )
  blockchainAreas: RegistrationBlockchainArea[];
}
