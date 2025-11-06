/* eslint-disable prettier/prettier */
import { 
  Controller, 
  Post, 
  Body, 
  Req, 
  HttpCode, 
  HttpStatus,
  Get 
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateRootDto } from './dto/create-root.dto';
import { JwtPayload } from './dto/login-response.dto';
import { Public } from './decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'] || '';
    return await this.authService.login(loginDto, userAgent);
  }

  @Post('create-root')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createRoot(@Body() createRootDto: CreateRootDto) {
    // This endpoint is only available in development or when explicitly enabled
    const allowRootCreation = this.configService.get<string>('ALLOW_ROOT_CREATION');
    
    if (process.env.NODE_ENV === 'production' && allowRootCreation !== 'true') {
      return { message: 'Endpoint not available' };
    }

    return await this.authService.createRoot(createRootDto);
  }

  @Get('verify')
  verifyToken(@Req() req: Request & { user: JwtPayload }) {
    // Token đã được verify bởi JWT Guard
    // Trả về thông tin user từ request
    const user = req.user;
    return {
      user: {
        id: user.sub,
        username: user.username,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
      },
    };
  }

  @Get('health')
  @Public()
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
