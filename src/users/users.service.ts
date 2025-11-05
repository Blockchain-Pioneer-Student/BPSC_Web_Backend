/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import { User } from '../users/entity/users.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(): Promise<User[]> {
    return await this.usersRepository.findAll();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findByEmail(email);
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findByUsername(username);
  }
  async remove(id: number): Promise<void> {
    // Kiểm tra user có tồn tại
    await this.findOne(id);
    await this.usersRepository.remove(id);
  }

  async count(): Promise<number> {
    return await this.usersRepository.count();
  }

  async findByRole(roleId: number): Promise<User[]> {
    return await this.usersRepository.findByRoleId(roleId);
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async create(userData: {
    username: string;
    email: string;
    password: string;
    role_id: number;
    is_verified?: boolean;
  }): Promise<User> {
    // Hash password trước khi lưu
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const userToCreate = {
      ...userData,
      password: hashedPassword,
    };

    return await this.usersRepository.create(userToCreate);
  }

}