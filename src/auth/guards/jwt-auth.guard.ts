/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokensService } from '../tokens.service';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../dto/login-response.dto';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokensService: TokensService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Extract token from HTTP-only cookie first, then fallback to Authorization header
    const token = this.extractTokenFromCookie(request) || this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      // Try to verify access token
      const payload: JwtPayload = this.tokensService.verifyAccessToken(token);
      
      // Get user info and attach to request
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach user and payload to request
      request.user = user;
      request.tokenPayload = payload;
      
      return true;
    } catch (error) {
      // Check if it's a token expiration error
      if (
        error instanceof Error && 
        error.message.includes('Access token has expired')
      ) {
        // Try to refresh token automatically
        const refreshResult = await this.tryRefreshToken(request, response);
        if (refreshResult) {
          return true;
        }
      }
      
      // If not expired or refresh failed, throw original error
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Invalid or expired token',
      );
    }
  }

  private async tryRefreshToken(request: any, response: any): Promise<boolean> {
    try {
      // Get refresh token from cookie first, then try to get user ID from expired access token
      let refreshToken = request.cookies?.refresh_token;
      let userId: number | null = null;

      if (refreshToken) {
        // If we have refresh token from cookie, verify it to get user ID
        try {
          const refreshPayload = await this.tokensService.verifyRefreshToken(refreshToken);
          userId = refreshPayload.sub;
        } catch {
          // Refresh token is invalid/expired
          refreshToken = null;
        }
      }

      if (!refreshToken || !userId) {
        // Try fallback method: get user ID from expired access token
        const accessToken = this.extractTokenFromCookie(request) || this.extractTokenFromHeader(request);
        if (!accessToken) {
          throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
        }

        // Decode token without verification to get user ID
        const decodedToken = this.tokensService.decodeTokenWithoutVerification(accessToken);
        if (!decodedToken || !decodedToken.sub) {
          throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
        }

        userId = decodedToken.sub;
        
        if (!userId) {
          throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
        }
        
        const userAgent = request.headers['user-agent'] || '';

        // Find active refresh token in database for this user and user-agent
        const refreshTokenEntity = await this.tokensService.findActiveRefreshToken(userId, userAgent);
        if (!refreshTokenEntity) {
          throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
        }

        refreshToken = refreshTokenEntity.token;
      }

      // Verify the refresh token
      const payload = await this.tokensService.verifyRefreshToken(refreshToken);
      
      // Get user information
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const newAccessToken = this.tokensService.generateAccessToken(user);
      
      // Update request headers with new token for backward compatibility
      request.headers.authorization = `Bearer ${newAccessToken}`;
      
      // Set new access token in HTTP-only cookie
      response.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      
      // Set new token in response header for client to update (backward compatibility)
      response.setHeader('X-New-Access-Token', newAccessToken);
      
      // Attach user to request
      request.user = user;
      request.tokenPayload = this.tokensService.verifyAccessToken(newAccessToken);

      return true;
    } catch (refreshError) {
      // If refresh token is also expired or invalid, clear cookies
      response.clearCookie('access_token');
      response.clearCookie('refresh_token');
      
      if (
        refreshError instanceof Error && 
        refreshError.message.includes('expired')
      ) {
        throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
      }
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
    }
  }

  private extractTokenFromCookie(request: any): string | null {
    return request.cookies?.access_token || null;
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}