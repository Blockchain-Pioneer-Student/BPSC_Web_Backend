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
    
    try {
      // Extract token from Authorization header
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException('Access token is required');
      }

      // Verify token
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
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Invalid or expired token'
      );
    }
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