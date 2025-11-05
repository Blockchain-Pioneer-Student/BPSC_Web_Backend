import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from './events.entity';

@Entity('event_schedules')
export class EventSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  event_id: number;

  @Column({ type: 'time', nullable: false })
  time?: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date', nullable: true })
  date?: string;

  // Relations
  @ManyToOne(() => Event, (event) => event.schedules)
  @JoinColumn({ name: 'event_id' })
  event: Event;
}
