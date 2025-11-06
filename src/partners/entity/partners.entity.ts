import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

@Entity('partners')
export class Partner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: false })
  logo: string;

  @Column({
    type: 'enum',
    enum: PartnerType,
    nullable: false,
    enumName: 'partner_type_enum',
  })
  type: PartnerType;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'text', nullable: true })
  website?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({
    type: 'enum',
    enum: PartnerStatus,
    nullable: false,
    default: PartnerStatus.ACTIVE,
    enumName: 'partner_status_enum',
  })
  status: PartnerStatus;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  updated_at: Date;
}
