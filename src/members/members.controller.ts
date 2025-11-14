/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { singleFileOptions } from 'src/core/middleware/multer.middleware';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/auth/guards/roles.guard';
import { Roles } from '../core/auth/decorators/roles.decorator';
import { Public } from '../core/auth/decorators/public.decorator';

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // Helper method to parse socials data
  private parseSocials(socials: any): Array<{ platform: string; url: string }> {
    if (!socials) return [];
    
    // If it's already an array (JSON request), return as is
    if (Array.isArray(socials)) {
      return socials as Array<{ platform: string; url: string }>;
    }
    
    // If it's a string (FormData), parse it
    if (typeof socials === 'string') {
      try {
        const parsed = JSON.parse(socials);
        return Array.isArray(parsed) ? parsed as Array<{ platform: string; url: string }> : [];
      } catch {
        return [];
      }
    }
    
    return [];
  }

  @Get('get-all')
  @Roles('admin')
  findAll(
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.membersService.findAll(sort, limitNum, status, search);
  }

  @Post('create')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('image_file', singleFileOptions))
  async createMember(
    @Body() body: any, // Use any to handle FormData conversion
    @UploadedFile()
    image_file?: {
      path: string;
      originalname: string;
      size: number;
      mimetype: string;
    },
  ) {
    // Convert FormData string values to proper types for DTO
    const createMemberDto: CreateMemberDto = {
      full_name: body.full_name as string,
      avatar_url: body.avatar_url as string,
      bio: body.bio as string,
      board_id: body.board_id ? parseInt(body.board_id as string, 10) : undefined,
      role_id: body.role_id ? parseInt(body.role_id as string, 10) : undefined,
      role_name: body.role_name as string,
      display_order: body.display_order ? parseInt(body.display_order as string, 10) : 0,
      is_active: body.is_active === 'true' || body.is_active === true,
      socials: this.parseSocials(body.socials),
    };
    
    return await this.membersService.createMemberWithDto(createMemberDto, image_file);
  }

  @Public()
  @Get('get-all-active')
  findAllActive(
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.membersService.findAllActive(sort, limitNum, search);
  }

  @Roles('admin')
  @Get('roles')
  findAllRoles() {
    return this.membersService.getAllRoles();
  }

  @Roles('admin')
  @Post('roles')
  createRole(@Body() body: { name: string }) {
    return this.membersService.createRole(body.name);
  }

  @Roles('admin')
  @Get('roles/search')
  findRoleByName(@Query('name') name: string) {
    return this.membersService.findRoleByName(name);
  }

  @Roles('admin')
  @Get(':id')
  findById(@Param('id') id: string) {
    const memberId = parseInt(id, 10);
    return this.membersService.findById(memberId);
  }

  @Patch('update/:id')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('image_file', singleFileOptions))
  async updateMember(
    @Param('id') id: string,
    @Body() body: any, // Use any to handle FormData conversion
    @UploadedFile()
    image_file?: {
      path: string;
      originalname: string;
      size: number;
      mimetype: string;
    },
  ) {
    const memberId = parseInt(id, 10);
    
    // Convert FormData string values to proper types for DTO
    const updateMemberDto: UpdateMemberDto = {
      ...(body.full_name && { full_name: body.full_name as string }),
      ...(body.avatar_url !== undefined && { avatar_url: body.avatar_url as string }),
      ...(body.bio !== undefined && { bio: body.bio as string }),
      ...(body.board_id !== undefined && { 
        board_id: body.board_id ? parseInt(body.board_id as string, 10) : null 
      }),
      ...(body.role_id !== undefined && { 
        role_id: body.role_id ? parseInt(body.role_id as string, 10) : null 
      }),
      ...(body.role_name !== undefined && { role_name: body.role_name as string }),
      ...(body.display_order !== undefined && { 
        display_order: body.display_order ? parseInt(body.display_order as string, 10) : 0 
      }),
      ...(body.is_active !== undefined && { 
        is_active: body.is_active === 'true' || body.is_active === true 
      }),
      ...(body.socials !== undefined && { 
        socials: this.parseSocials(body.socials)
      }),
    };
    
    return await this.membersService.updateMemberWithDto(memberId, updateMemberDto, image_file);
  }

  @Roles('admin')
  @Delete(':id')
  deleteById(@Param('id') id: string) {
    const memberId = parseInt(id, 10);
    return this.membersService.delete(memberId);
  }
}
