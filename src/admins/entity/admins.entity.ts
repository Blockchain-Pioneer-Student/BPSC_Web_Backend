/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToOne,
} from 'typeorm';
import { User } from 'src/users/entity/users.entity';
@Entity('admins')
export class Admin {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ type: 'varchar', length: 150, nullable: false })
    full_name: string;
    @Column({ type: 'varchar', length: 150, nullable: false, unique: true })
    phone_number: string;
    @OneToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;
}