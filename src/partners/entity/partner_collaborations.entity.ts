import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Partner } from './partners.entity';

@Entity('partner_collaborations')
export class PartnerCollaboration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  partner_id: number;

  @Column({ type: 'text' })
  collaboration: string;

  // Relations
  @ManyToOne(() => Partner, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partner_id' })
  partner: Partner;
}
