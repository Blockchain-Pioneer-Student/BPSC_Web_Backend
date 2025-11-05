import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('event_categories')
export class EventCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  name: string;
}
