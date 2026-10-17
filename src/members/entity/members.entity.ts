import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Board } from '../../boards/entity/boards.entity';
import { MemberRole } from './member_roles.entity';
import { MemberSocial } from './member_socials.entity';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, nullable: false })
  full_name: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'integer', nullable: true })
  board_id: number | null;

  @Column({ type: 'integer', nullable: true })
  role_id: number;

  @Column({ type: 'integer', default: 0 })
  display_order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // Relationships
  @ManyToOne(() => Board, (board) => board.members)
  @JoinColumn({ name: 'board_id' })
  board: Board | null;

  @ManyToOne(() => MemberRole, (role) => role.members)
  @JoinColumn({ name: 'role_id' })
  role: MemberRole;

  @OneToMany(() => MemberSocial, (social) => social.member)
  socials: MemberSocial[];
}