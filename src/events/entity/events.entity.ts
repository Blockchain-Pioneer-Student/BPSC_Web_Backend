import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { EventCategory as EventCategoryEntity } from './event_categories.entity';
import { EventSchedule } from './event_schedules.entity';
import { EventSpeaker } from './event_speakers.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'date', nullable: false })
  date: string;

  @Column({ type: 'time', nullable: true })
  time?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  excerpt?: string;

  @Column({ type: 'text', nullable: true })
  image?: string;

  @Column({ type: 'integer', default: 0 })
  views: number;

  @Column({ type: 'integer', default: 0 })
  likes: number;

  @Column({ type: 'integer', default: 0 })
  comments: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status?: string;

  @Column({ type: 'text', nullable: true })
  registration_link?: string;

  @Column({ type: 'text', nullable: true })
  notion_content?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'integer', nullable: true })
  category_id?: number;

  // Relations
  @ManyToOne(() => EventCategoryEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category?: EventCategoryEntity;

  @OneToMany(() => EventSchedule, (schedule) => schedule.event, { cascade: true })
  schedules: EventSchedule[];

  @OneToMany(() => EventSpeaker, (speaker) => speaker.event, { cascade: true })
  speakers: EventSpeaker[];
}

export enum EventCategory {
  WORKSHOP = 'workshop',
  SEMINAR = 'seminar',
  CONFERENCE = 'conference',
  MEETUP = 'meetup',
  HACKATHON = 'hackathon',
  NETWORKING = 'networking',
  OTHER = 'other',
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}
