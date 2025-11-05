// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entity/refresh-token.entity';
import { JwtPayload } from './dto/login-response.dto';
import { User } from '../users/entity/users.entity';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * Generate access token with user information
   */
  generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role?.name || 'customer',
      roleId: user.role?.id || 0,
      is_verified: user.is_verified,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
    } as any);
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(user: User, userAgent?: string): Promise<string> {
    const payload = {
      sub: user.id,
      type: 'refresh',
    };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    } as any);

    // Save refresh token to database
    await this.saveRefreshToken(user.id, refreshToken, userAgent);

    return refreshToken;
  }

  /**
   * Save refresh token to database
   */
  private async saveRefreshToken(userId: number, token: string, userAgent?: string): Promise<void> {
    // Check if there's an existing refresh token for this user and user-agent that's not expired
    const existingToken = await this.refreshTokenRepository
      .createQueryBuilder('refresh_token')
      .where('refresh_token.user_id = :userId', { userId })
      .andWhere('refresh_token.user_agent = :userAgent', { userAgent: userAgent || null })
      .andWhere('refresh_token.expires_at > :now', { now: new Date() })
      .getOne();

    if (existingToken) {
      // If token exists and is still valid, just reactivate it with new token
      await this.refreshTokenRepository.update(
        { id: existingToken.id },
        { 
          token,
          is_active: true 
        }
      );
    } else {
      // Delete all old refresh tokens for this user (both active and inactive)
      await this.refreshTokenRepository.delete({
        user_id: userId
      });

      // Calculate expiration date
      const expiresIn = this.configService.get<number>('JWT_REFRESH_EXPIRES_IN_SECONDS') || 7 * 24 * 60 * 60; // 7 days in seconds
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Create new refresh token entry
      const refreshTokenEntity = this.refreshTokenRepository.create({
        token,
        user_id: userId,
        user_agent: userAgent,
        expires_at: expiresAt,
        is_active: true,
      });

      await this.refreshTokenRepository.save(refreshTokenEntity);
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return payload as JwtPayload;
    } catch (error: any) {
      console.error('Access token verification error:', error);
      
      // Type guard for error object
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const errorName = (error && typeof error === 'object' && 'name' in error) ? error.name : '';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const errorMessage = (error && typeof error === 'object' && 'message' in error) ? error.message : '';
      
      // Check for specific JWT errors
      if (errorName === 'TokenExpiredError') {
        throw new Error('Access token has expired');
      } else if (errorName === 'JsonWebTokenError') {
        throw new Error('Invalid access token format');
      } else if (errorName === 'NotBeforeError') {
        throw new Error('Access token not active yet');
      } else {
        throw new Error(`Invalid access token: ${errorMessage || 'Unknown error'}`);
      }
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<{ sub: number; type: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const typedPayload = payload as { sub: number; type: string };

      // Check if refresh token exists and is active in database
      const refreshTokenEntity = await this.refreshTokenRepository.findOne({
        where: {
          token,
          is_active: true,
        },
      });

      if (!refreshTokenEntity) {
        throw new Error('Refresh token not found or inactive');
      }

      // Check if token is expired
      if (refreshTokenEntity.expires_at < new Date()) {
        throw new Error('Refresh token has expired');
      }

      return typedPayload;
    } catch (error: any) {
      console.error('Refresh token verification error:', error);
      
      // Type guard for error object
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const errorName = (error && typeof error === 'object' && 'name' in error) ? error.name : '';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const errorMessage = (error && typeof error === 'object' && 'message' in error) ? error.message : '';
      
      // Check for specific JWT errors
      if (errorName === 'TokenExpiredError') {
        throw new Error('Refresh token has expired');
      } else if (errorName === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token format');
      } else if (errorName === 'NotBeforeError') {
        throw new Error('Refresh token not active yet');
      } else if (errorMessage) {
        // This handles our custom error messages (not found, expired, etc.)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        throw new Error(errorMessage);
      } else {
        throw new Error('Invalid refresh token: Unknown error');
      }
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { token, is_active: true },

      { is_active: false }
    );
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllRefreshTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { user_id: userId, is_active: true },
      { is_active: false }
    );
  }

  /**
   * Check if user has any active refresh tokens
   */
  async hasActiveRefreshTokens(userId: number): Promise<boolean> {
    const activeTokensCount = await this.refreshTokenRepository.count({
      where: {
        user_id: userId,
        is_active: true,
      },
    });
    
    return activeTokensCount > 0;
  }

  /**
   * Get token expiration time in seconds
   */
  getAccessTokenExpiresIn(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    
    // Convert time string to seconds
    if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60;
    } else if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 60 * 60;
    } else if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 24 * 60 * 60;
    } else {
      return parseInt(expiresIn); // Assume seconds
    }
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expires_at: new Date(),
      is_active: false,
    });
  }
}