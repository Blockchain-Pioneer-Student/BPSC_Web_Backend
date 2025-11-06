import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Member } from './members.entity';

@Entity('member_socials')
export class MemberSocial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: false })
  member_id: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  platform: string;

  @Column({ type: 'text', nullable: false })
  url: string;

  // Relationship: Many socials belong to one member
  @ManyToOne(() => Member, (member) => member.socials)
  @JoinColumn({ name: 'member_id' })
  member: Member;
}
