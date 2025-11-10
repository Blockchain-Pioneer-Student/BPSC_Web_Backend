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
    
    // Automatically set HTTP-only cookies for tokens
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1 * 60 * 1000, // 1 minute for testing
    });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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

  @Get('token-status')
  @Public()
  getTokenStatus(@Req() req: Request) {
    const accessToken = req.cookies['access_token'] as string;
    
    if (!accessToken) {
      return { 
        hasToken: false, 
        isValid: false, 
        timeUntilExpiry: 0,
        shouldRefresh: true 
      };
    }

    try {
      // Decode token without verification to get expiry
      const decoded = this.authService.decodeToken(accessToken) as { exp: number };
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      
      // Should refresh if less than 30 seconds remaining (for 1-minute token)
      const shouldRefresh = timeUntilExpiry < 30; // 30 seconds
      
      return {
        hasToken: true,
        isValid: timeUntilExpiry > 0,
        timeUntilExpiry: Math.max(0, timeUntilExpiry),
        shouldRefresh,
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
      };
    } catch {
      return { 
        hasToken: true, 
        isValid: false, 
        timeUntilExpiry: 0,
        shouldRefresh: true 
      };
    }
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'] as string;
    
    if (!refreshToken) {
      return { success: false, message: 'Refresh token not found' };
    }

    try {
      const result = await this.authService.refreshToken(refreshToken);
      
      // Set new access token cookie
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1 * 60 * 1000, // 15 minutes

      });

      // Optionally set new refresh token if provided
      if (result.refresh_token) {
        res.cookie('refresh_token', result.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      return { 
        success: true, 
        message: 'Token refreshed successfully',
        expires_in: result.expires_in,
      };
    } catch {
      // Clear cookies if refresh fails
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return { success: false, message: 'Token refresh failed' };
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

    // Set HTTP-only cookie for access token
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1 * 60 * 1000, // 1 minute for testing
    });

    // Set HTTP-only cookie for refresh token if provided
    if (refresh_token) {
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
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
