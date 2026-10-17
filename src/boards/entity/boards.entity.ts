import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Member } from '../../members/entity/members.entity';

@Entity('boards')
export class Board {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer', default: 1000 })
  display_order: number;

  @Column({ type: 'boolean', default: true })
  is_visible: boolean;

  // Relationship: One board has many members
  @OneToMany(() => Member, (member) => member.board)
  members: Member[];
}
