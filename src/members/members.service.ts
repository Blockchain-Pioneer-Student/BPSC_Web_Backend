/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Member } from './entity/members.entity';
import { MemberRole } from './entity/member_roles.entity';
import { MemberSocial } from './entity/member_socials.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersRepository } from './members.repository';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class MembersService {
  constructor(private readonly membersRepository: MembersRepository) {}

  async findAll(
    sort?: string,
    limit?: number,
    status?: string,
    search?: string,
  ): Promise<Member[]> {
    return await this.membersRepository.findAllWithFilters(sort, limit, status, search);
  }

  async findById(id: number): Promise<Member | null> {
    return await this.membersRepository.findById(id);
  }

  async createMemberWithDto(
    createMemberDto: CreateMemberDto,
    image_file?: {
      path: string;
      originalname: string;
      size: number;
      mimetype: string;
    },
  ): Promise<Member> {
    let avatarUrl = createMemberDto.avatar_url;

    // Handle image upload if provided
    if (image_file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(
          image_file.path,
          {
            folder: 'bpsclub/members',
            resource_type: 'image',
            public_id: `member_${Date.now()}`,
          }
        );
        avatarUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Error uploading member image:', error);
        throw new Error('Failed to upload member image');
      }
    }

    // Handle role_name if provided (find existing or create new)
    let roleId = createMemberDto.role_id;
    if (createMemberDto.role_name) {
      const role = await this.membersRepository.findOrCreateRole(createMemberDto.role_name);
      roleId = role.id;
    }

    // Create member data without socials
    const memberData = {
      full_name: createMemberDto.full_name,
      avatar_url: avatarUrl,
      bio: createMemberDto.bio,
      board_id: createMemberDto.board_id,
      role_id: roleId,
      display_order: createMemberDto.display_order || 0,
      is_active: createMemberDto.is_active ?? true,
    };

    const member = await this.membersRepository.create(memberData);

    // Handle socials if provided
    if (createMemberDto.socials && createMemberDto.socials.length > 0 && member.id) {
      await this.createMemberSocials(member.id, createMemberDto.socials);
    }

    return member;
  }

  async updateMemberWithDto(
    id: number,
    updateMemberDto: UpdateMemberDto,
    image_file?: {
      path: string;
      originalname: string;
      size: number;
      mimetype: string;
    },
  ): Promise<Member | null> {
    const existingMember = await this.membersRepository.findById(id);
    if (!existingMember) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    let avatarUrl = updateMemberDto.avatar_url || existingMember.avatar_url;

    // Handle image upload if provided
    if (image_file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(
          image_file.path,
          {
            folder: 'bpsclub/members',
            resource_type: 'image',
            public_id: `member_${id}_${Date.now()}`,
          }
        );
        avatarUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Error uploading member image:', error);
        throw new Error('Failed to upload member image');
      }
    }

    // Handle role_name if provided (find existing or create new)
    let roleId = updateMemberDto.role_id;
    if (updateMemberDto.role_name) {
      const role = await this.membersRepository.findOrCreateRole(updateMemberDto.role_name);
      roleId = role.id;
    }

    // Update member data without socials and image_file
    const memberData = {
      ...(updateMemberDto.full_name && { full_name: updateMemberDto.full_name }),
      avatar_url: avatarUrl,
      ...(updateMemberDto.bio !== undefined && { bio: updateMemberDto.bio }),
      ...(updateMemberDto.board_id !== undefined && { board_id: updateMemberDto.board_id }),
      ...(roleId !== undefined && { role_id: roleId }),
      ...(updateMemberDto.display_order !== undefined && { display_order: updateMemberDto.display_order }),
      ...(updateMemberDto.is_active !== undefined && { is_active: updateMemberDto.is_active }),
    };

    const updatedMember = await this.membersRepository.update(id, memberData);

    // Handle socials if provided
    if (updateMemberDto.socials !== undefined) {
      await this.updateMemberSocials(id, updateMemberDto.socials);
    }

    return updatedMember;
  }

  async delete(id: number): Promise<void> {
    const existingMember = await this.membersRepository.findById(id);
    if (!existingMember) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }
    
    // Delete member socials first
    await this.membersRepository.deleteMemberSocials(id);
    
    // Then delete the member
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

  async findAllActive(
    sort?: string,
    limit?: number,
    search?: string,
  ): Promise<Member[]> {
    return await this.membersRepository.findAllActiveWithFilters(sort, limit, search);
  }

  async getAllRoles(): Promise<MemberRole[]> {
    // This should be implemented with proper role repository
    return await this.membersRepository.findAllRoles();
  }

  async createRole(name: string): Promise<MemberRole> {
    return await this.membersRepository.createRole(name);
  }

  async findRoleByName(name: string): Promise<MemberRole | null> {
    return await this.membersRepository.findRoleByName(name);
  }

  private async createMemberSocials(memberId: number, socials: Array<{ platform: string; url: string }>): Promise<void> {
    if (socials && socials.length > 0) {
      await this.membersRepository.createMemberSocials(memberId, socials);
    }
  }

  private async updateMemberSocials(memberId: number, socials: Array<{ platform: string; url: string }>): Promise<void> {
    await this.membersRepository.updateMemberSocials(memberId, socials);
  }
}
