/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Member } from './entity/members.entity';
import { MemberRole } from './entity/member_roles.entity';

@Injectable()
export class MembersRepository {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  async findAll(): Promise<Member[]> {
    return await this.memberRepository.find({
      relations: ['board', 'role', 'socials'],
      order: { display_order: 'ASC' },
    });
  }

  async findById(id: number): Promise<Member | null> {
    return await this.memberRepository.findOne({
      where: { id },
      relations: ['board', 'role', 'socials'],
    });
  }

  async create(memberData: Partial<Member>): Promise<Member> {
    const member = this.memberRepository.create(memberData);
    return await this.memberRepository.save(member);
  }

  async update(id: number, memberData: Partial<Member>): Promise<Member | null> {
    await this.memberRepository.update(id, memberData);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.memberRepository.delete(id);
  }

  async findByBoardId(boardId: number): Promise<Member[]> {
    return await this.memberRepository.find({
      where: { board_id: boardId },
      relations: ['board', 'role', 'socials'],
      order: { display_order: 'ASC' },
    });
  }

  async findByRoleId(roleId: number): Promise<Member[]> {
    return await this.memberRepository.find({
      where: { role_id: roleId },
      relations: ['board', 'role', 'socials'],
      order: { display_order: 'ASC' },
    });
  }

  async findActive(): Promise<Member[]> {
    return await this.memberRepository.find({
      where: { is_active: true },
      relations: ['board', 'role', 'socials'],
      order: { display_order: 'ASC' },
    });
  }
}
