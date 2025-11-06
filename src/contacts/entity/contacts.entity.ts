import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, nullable: false })
  full_name: string;

  @Column({ type: 'varchar', length: 150, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  subject: string;

  @Column({ type: 'text', nullable: false })
  message: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
