import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Member } from './members.entity';

@Entity('member_roles')
export class MemberRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, nullable: false })
  name: string;

  // Relationship: One role can have many members
  @OneToMany(() => Member, (member) => member.role)
  members: Member[];
}
