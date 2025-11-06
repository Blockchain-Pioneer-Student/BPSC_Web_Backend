import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Registration } from './registrations.entity';
import { BlockchainArea } from '../../blockchain_areas/entity/blockchain_areas.entity';

@Entity('registration_blockchain_areas')
@Unique(['registration_id', 'area_id'])
export class RegistrationBlockchainArea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: false })
  registration_id: number;

  @Column({ type: 'integer', nullable: false })
  area_id: number;

  @ManyToOne(
    () => Registration,
    (registration) => registration.blockchainAreas,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'registration_id' })
  registration: Registration;

  @ManyToOne(() => BlockchainArea, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'area_id' })
  blockchainArea: BlockchainArea;
}