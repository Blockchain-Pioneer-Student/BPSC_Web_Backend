import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Partner } from './partners.entity';

@Entity('partner_achievements')
export class PartnerAchievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  partner_id: number;

  @Column({ type: 'text' })
  achievement: string;

  // Relations
  @ManyToOne(() => Partner, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partner_id' })
  partner: Partner;
}
