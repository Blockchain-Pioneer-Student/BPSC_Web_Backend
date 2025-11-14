/* eslint-disable prettier/prettier */
import { 
  Controller, 
  Post, 
  Body, 
  Req, 
  Res,
  HttpCode, 
  HttpStatus,
  Get
} from '@nestjs/common';
import type { Request, Response } from 'express';
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
  async login(@Body() loginDto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userAgent = req.headers['user-agent'] || '';
    const result = await this.authService.login(loginDto, userAgent);
  
    // Clear existing cookies first
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  
    // Cross-origin cookies configuration
    const cookieConfig = {
      httpOnly: true,
      secure: true, // Always true for production HTTPS
      sameSite: 'none' as const, // Required for cross-origin
      path: '/',
    };
  
    // Set HTTP-only cookies for tokens
    res.cookie('access_token', result.access_token, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000, // 15 minutes for testing
    });

    res.cookie('refresh_token', result.refresh_token, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user info without tokens (tokens are now in HTTP-only cookies)
    return {
      user: result.user,
      expires_in: result.expires_in,
    };
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
  async verifyToken(@Req() req: Request & { user: JwtPayload }) {
    // Token đã được verify bởi JWT Guard
    // Lấy thông tin user đầy đủ từ database
    const userFromDb = await this.authService.getUserById(req.user.sub);
    
    if (!userFromDb) {
      return { user: null };
    }

    return {
      user: {
        id: userFromDb.id,
        username: userFromDb.username,
        email: userFromDb.email,
        avatar_url: userFromDb.avatar_url || '',
        is_verified: userFromDb.is_verified,
        role: userFromDb.role?.name || 'customer',
      },
      exp: req.user.exp, // Thêm expiry time để frontend biết khi nào cần refresh
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'] as string;
    
    if (!refreshToken) {
      // Clear cookies and throw proper 401 error
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      res.status(HttpStatus.UNAUTHORIZED);
      throw new Error('Phiên đăng nhập đã hết hạn');
    }

    try {
      const result = await this.authService.refreshToken(refreshToken);
      
      if (!result) {
        // Clear cookies and throw proper 401 error
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        res.status(HttpStatus.UNAUTHORIZED);
        throw new Error('Phiên đăng nhập đã hết hạn');
      }
      
      // Cross-origin cookie config
      const cookieConfig = {
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const,
        path: '/',
      };
      
      // Set new access token cookie
      res.cookie('access_token', result.access_token, {
        ...cookieConfig,
        maxAge: 15 * 60 * 1000, // 15 minutes for testing
      });

      // Optionally set new refresh token if provided
      if (result.refresh_token) {
        res.cookie('refresh_token', result.refresh_token, {
          ...cookieConfig,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      return { 
        success: true, 
        message: 'Token refreshed successfully',
        expires_in: result.expires_in || 60,
      };
    } catch {
      // Clear cookies and throw proper 401 error
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      res.status(HttpStatus.UNAUTHORIZED);
      throw new Error('Phiên đăng nhập đã hết hạn');
    }
  }

  @Get('health')
  @Public()
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Post('set-cookie')
  @Public()
  @HttpCode(HttpStatus.OK)
  setCookie(@Body() body: { access_token: string; refresh_token?: string }, @Res({ passthrough: true }) res: Response) {
    const { access_token, refresh_token } = body;
    
    if (!access_token) {
      return { success: false, message: 'Access token is required' };
    }

    // Cross-origin cookie config
    const cookieConfig = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      path: '/',
    };

    // Set HTTP-only cookie for access token
    res.cookie('access_token', access_token, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000, // 15 minutes for testing
    });

    // Set HTTP-only cookie for refresh token if provided
    if (refresh_token) {
      res.cookie('refresh_token', refresh_token, {
        ...cookieConfig,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    return { success: true, message: 'Cookies set successfully' };
  }

  @Post('clear-cookie')
  @Public()
  @HttpCode(HttpStatus.OK)
  clearCookie(@Res({ passthrough: true }) res: Response) {
    // Clear both access and refresh token cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    
    return { success: true, message: 'Cookies cleared successfully' };
  }
}
