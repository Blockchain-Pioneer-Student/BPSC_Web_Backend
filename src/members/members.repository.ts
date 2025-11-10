/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Member } from './entity/members.entity';
import { MemberRole } from './entity/member_roles.entity';
import { MemberSocial } from './entity/member_socials.entity';

@Injectable()
export class MembersRepository {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(MemberRole)
    private readonly memberRoleRepository: Repository<MemberRole>,
    @InjectRepository(MemberSocial)
    private readonly memberSocialRepository: Repository<MemberSocial>,
  ) {}

  async findAll(): Promise<Member[]> {
    return await this.memberRepository.find({
      relations: ['board', 'role', 'socials'],
      order: { display_order: 'ASC' },
    });
  }

  async findAllWithFilters(
    sort?: string,
    limit?: number,
    status?: string,
    search?: string,
  ): Promise<Member[]> {
    const queryBuilder = this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.board', 'board')
      .leftJoinAndSelect('member.role', 'role')
      .leftJoinAndSelect('member.socials', 'socials');

    // Apply status filter
    if (status === 'active') {
      queryBuilder.where('member.is_active = :isActive', { isActive: true });
    } else if (status === 'inactive') {
      queryBuilder.where('member.is_active = :isActive', { isActive: false });
    }

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(member.full_name ILIKE :search OR member.bio ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    if (sort) {
      const [field, direction] = sort.split('_');
      const order = direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      
      if (field === 'name') {
        queryBuilder.orderBy('member.full_name', order);
      } else if (field === 'order') {
        queryBuilder.orderBy('member.display_order', order);
      } else if (field === 'created') {
        queryBuilder.orderBy('member.id', order);
      } else {
        queryBuilder.orderBy('member.display_order', 'ASC');
      }
    } else {
      queryBuilder.orderBy('member.display_order', 'ASC');
    }

    // Apply limit
    if (limit) {
      queryBuilder.limit(limit);
    }

    return await queryBuilder.getMany();
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

  async findAllActiveWithFilters(
    sort?: string,
    limit?: number,
    search?: string,
  ): Promise<Member[]> {
    const queryBuilder = this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.board', 'board')
      .leftJoinAndSelect('member.role', 'role')
      .leftJoinAndSelect('member.socials', 'socials')
      .where('member.is_active = :isActive', { isActive: true });

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(member.full_name ILIKE :search OR member.bio ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    if (sort) {
      const [field, direction] = sort.split('_');
      const order = direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      
      if (field === 'name') {
        queryBuilder.orderBy('member.full_name', order);
      } else if (field === 'order') {
        queryBuilder.orderBy('member.display_order', order);
      } else {
        queryBuilder.orderBy('member.display_order', 'ASC');
      }
    } else {
      queryBuilder.orderBy('member.display_order', 'ASC');
    }

    // Apply limit
    if (limit) {
      queryBuilder.limit(limit);
    }

    return await queryBuilder.getMany();
  }

  async findAllRoles(): Promise<MemberRole[]> {
    return await this.memberRoleRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findRoleByName(name: string): Promise<MemberRole | null> {
    return await this.memberRoleRepository.findOne({
      where: { name: name.trim() },
    });
  }

  async createRole(name: string): Promise<MemberRole> {
    const role = this.memberRoleRepository.create({ name: name.trim() });
    return await this.memberRoleRepository.save(role);
  }

  async findOrCreateRole(name: string): Promise<MemberRole> {
    const trimmedName = name.trim();
    let role = await this.findRoleByName(trimmedName);
    
    if (!role) {
      role = await this.createRole(trimmedName);
    }
    
    return role;
  }

  // Member Socials methods
  async createMemberSocials(memberId: number, socials: Array<{ platform: string; url: string }>): Promise<MemberSocial[]> {
    const socialEntities = socials.map(social => 
      this.memberSocialRepository.create({
        member_id: memberId,
        platform: social.platform,
        url: social.url,
      })
    );
    
    return await this.memberSocialRepository.save(socialEntities);
  }

  async updateMemberSocials(memberId: number, socials: Array<{ platform: string; url: string }>): Promise<void> {
    // Delete existing socials for this member
    await this.memberSocialRepository.delete({ member_id: memberId });
    
    // Create new socials if any provided
    if (socials && socials.length > 0) {
      await this.createMemberSocials(memberId, socials);
    }
  }

  async deleteMemberSocials(memberId: number): Promise<void> {
    await this.memberSocialRepository.delete({ member_id: memberId });
  }

  async findMemberSocials(memberId: number): Promise<MemberSocial[]> {
    return await this.memberSocialRepository.find({
      where: { member_id: memberId },
    });
  }
}
