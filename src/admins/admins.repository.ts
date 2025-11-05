/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './entity/admins.entity';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminsRepository {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async findAll(): Promise<Admin[]> {
    return await this.adminRepository.find({
      relations: ['user', 'user.role'],
    });
  }

  async findOne(id: number): Promise<Admin | null> {
    return await this.adminRepository.findOne({
      where: { id },
      relations: ['user', 'user.role'],
    });
  }

  async findByUserId(userId: number): Promise<Admin | null> {
    return await this.adminRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'user.role'],
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Admin | null> {
    return await this.adminRepository.findOne({
      where: { phone_number: phoneNumber },
      relations: ['user', 'user.role'],
    });
  }

  async create(adminData: Partial<Admin>): Promise<Admin> {
    const admin = this.adminRepository.create(adminData);
    return await this.adminRepository.save(admin);
  }

  async update(id: number, adminData: Partial<Admin>): Promise<Admin | null> {
    await this.adminRepository.update(id, adminData);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.adminRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async count(): Promise<number> {
    return await this.adminRepository.count();
  }
}
