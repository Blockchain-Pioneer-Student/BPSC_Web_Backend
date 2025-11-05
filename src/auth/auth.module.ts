import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entity/users.entity';
import { RefreshToken } from './entity/refresh-token.entity';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([User, RefreshToken]),
        UsersModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'default-secret',
                signOptions: {
                    expiresIn: '24h',
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, TokensService, JwtAuthGuard, RolesGuard],
    exports: [AuthService, TokensService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule { }