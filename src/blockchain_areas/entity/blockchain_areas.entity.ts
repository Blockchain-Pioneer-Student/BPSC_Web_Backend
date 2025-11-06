import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('blockchain_areas')
export class BlockchainArea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 150,
    unique: true,
    nullable: false,
  })
  name: string;
}
