/* eslint-disable prettier/prettier */
import { 
  Controller, 
  Post, 
  Body, 
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post('create')
  @Roles('root')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAdminDto: CreateAdminDto) {
    const admin = await this.adminsService.create(createAdminDto);
    
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
