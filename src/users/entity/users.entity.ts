/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '../../roles/entity/roles.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 150, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  password: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @Column({ type: 'integer', nullable: true })
  role_id: number;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}