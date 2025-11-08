/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Member } from './entity/members.entity';
import { MemberRole } from './entity/member_roles.entity';
import { MembersRepository } from './members.repository';

@Injectable()
export class MembersService {
  constructor(private readonly membersRepository: MembersRepository) {}

  async findAll(): Promise<Member[]> {
    return await this.membersRepository.findAll();
  }

  async findById(id: number): Promise<Member | null> {
    return await this.membersRepository.findById(id);
  }

  async create(memberData: Partial<Member>): Promise<Member> {
    return await this.membersRepository.create(memberData);
  }

  async update(id: number, memberData: Partial<Member>): Promise<Member | null> {
    return await this.membersRepository.update(id, memberData);
  }

  async delete(id: number): Promise<void> {
    return await this.membersRepository.delete(id);
  }

  async findByBoardId(boardId: number): Promise<Member[]> {
    return await this.membersRepository.findByBoardId(boardId);
  }

  async findByRoleId(roleId: number): Promise<Member[]> {
    return await this.membersRepository.findByRoleId(roleId);
  }

  async findActive(): Promise<Member[]> {
    return await this.membersRepository.findActive();
  }

  async findAllActive(): Promise<Member[]> {
    return await this.membersRepository.findActive();
  }
}
