import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/users.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: {
    username: string;
    email: string;
    password: string;
    role_id: number;
    is_verified?: boolean;
  }): Promise<User> {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      relations: ['role'],
    });
  }

  async findOne(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username },
      relations: ['role'],
    });
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async count(): Promise<number> {
    return await this.userRepository.count();
  }

  async findByRoleId(roleId: number): Promise<User[]> {
    return await this.userRepository.find({
      where: { role_id: roleId },
      relations: ['role'],
    });
  }
}