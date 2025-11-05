/* eslint-disable prettier/prettier */
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminsRepository } from './admins.repository';
import { UsersService } from '../users/users.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { Admin } from './entity/admins.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminsService {
  constructor(
    private readonly adminsRepository: AdminsRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const { full_name, phone_number, username, email, password } = createAdminDto;

    // Check if user already exists
    const existingUserByEmail = await this.usersService.findByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingUserByUsername = await this.usersService.findByUsername(username);
    if (existingUserByUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check if phone number already exists
    const existingAdmin = await this.adminsRepository.findByPhoneNumber(phone_number);
    if (existingAdmin) {
      throw new ConflictException('Phone number already exists');
    }

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Get admin role (assuming role id 2 is admin)
      const adminRoleId = 2; // You might want to get this from roles service

      // Create user first
      const user = await this.usersService.create({
        username,
        email,
        password: hashedPassword,
        role_id: adminRoleId,
        is_verified: true, // Admin accounts are verified by default
      });

      // Create admin profile
      const admin = await this.adminsRepository.create({
        full_name,
        phone_number,
        user,
      });

      return admin;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to create admin account: ${errorMessage}`);
    }
  }

  async findAll(): Promise<Admin[]> {
    return await this.adminsRepository.findAll();
  }

  async findOne(id: number): Promise<Admin> {
    const admin = await this.adminsRepository.findOne(id);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    return admin;
  }

  async findByUserId(userId: number): Promise<Admin> {
    const admin = await this.adminsRepository.findByUserId(userId);
    if (!admin) {
      throw new NotFoundException(`Admin with user ID ${userId} not found`);
    }
    return admin;
  }

  async remove(id: number): Promise<void> {
    const admin = await this.adminsRepository.findOne(id);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // Remove admin profile first, then user account
    await this.adminsRepository.remove(id);
    if (admin.user) {
      await this.usersService.remove(admin.user.id);
    }
  }

  async count(): Promise<number> {
    return await this.adminsRepository.count();
  }
}
