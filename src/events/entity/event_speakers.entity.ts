import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from './events.entity';

@Entity('event_speakers')
export class EventSpeaker {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  event_id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  role?: string;

  @Column({ type: 'text', nullable: true })
  avatar_img?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  // Relations
  @ManyToOne(() => Event, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;
}

// Common speaker roles enum
export enum SpeakerRole {
  KEYNOTE_SPEAKER = 'Keynote Speaker',
  GUEST_SPEAKER = 'Guest Speaker',
  PANELIST = 'Panelist',
  MODERATOR = 'Moderator',
  WORKSHOP_LEADER = 'Workshop Leader',
  FACILITATOR = 'Facilitator',
  EXPERT = 'Expert',
  ENTREPRENEUR = 'Entrepreneur',
  DEVELOPER = 'Developer',
  RESEARCHER = 'Researcher',
  OTHER = 'Other',
}
