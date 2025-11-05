/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// database.service.ts
import { neon } from '@neondatabase/serverless';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService {
    private readonly sql: any;

    constructor(private configService: ConfigService) {
        const databaseUrl = this.configService.get<string>('DATABASE_URL');
        this.sql = neon(databaseUrl!);
    }
}