import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('partners')
export class Partner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  logo: string;

  @Column({ type: 'varchar', length: 50 })
  type: PartnerType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  website?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 20 })
  status: PartnerStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export enum PartnerType {
  ACADEMIC = 'academic',
  BUSINESS = 'business',
  COMMUNITY = 'community',
  GOVERNMENT = 'government',
  TECHNOLOGY = 'technology',
}

export enum PartnerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}
