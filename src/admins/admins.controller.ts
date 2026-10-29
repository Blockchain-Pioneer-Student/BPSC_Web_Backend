/* eslint-disable prettier/prettier */
import { 
  Controller, 
  Post, 
  Body, 
  UseGuards,
  HttpStatus,
  HttpCode,
  NotFoundException
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/auth/guards/roles.guard';
import { Roles } from '../core/auth/decorators/roles.decorator';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post('create')
  @Roles('root')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAdminDto: CreateAdminDto) {
    const admin = await this.adminsService.create(createAdminDto);
    if(!admin.user) {
      throw new NotFoundException("Admin user not found");
    }
    // Không trả về password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...adminWithoutPassword } = admin.user;
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Admin created successfully',
      data: {
        ...admin,
        user: adminWithoutPassword
      }
    };
  }
}
