/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokensService } from './tokens.service';
import { LoginDto } from './dto/login.dto';
import { CreateRootDto } from './dto/create-root.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
  ) {}

  async login(loginDto: LoginDto, userAgent?: string) {
    const { identifier, password } = loginDto;

    // Try to find user by email or username
    let user = await this.usersService.findByEmail(identifier);
    if (!user) {
      user = await this.usersService.findByUsername(identifier);
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.tokensService.generateAccessToken(user);
    const refreshToken = await this.tokensService.generateRefreshToken(user, userAgent);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.tokensService.getAccessTokenExpiresIn(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role?.name || 'customer',
        is_verified: user.is_verified,
      },
    };
  }

  async createRoot(createRootDto: CreateRootDto) {
    const { username, email, password } = createRootDto;

    // Check if root user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Root user already exists');
    }

    const existingUsername = await this.usersService.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Create root user (role_id: 1 = root)
    const rootUser = await this.usersService.create({
      username,
      email,
      password,
      role_id: 1, // Root role
      is_verified: true,
    });

    return {
      message: 'Root user created successfully',
      user: {
        id: rootUser.id,
        username: rootUser.username,
        email: rootUser.email,
      },
    };
  }
}