import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class LocalDevelopmentDatabaseService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const isLocalSchemaSyncEnabled =
      this.configService.get<string>('NODE_ENV') !== 'production' &&
      this.configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true';

    if (!isLocalSchemaSyncEnabled) return;

    // A fresh local database needs the fixed IDs used by the auth/admin code.
    await this.dataSource.query(`
      INSERT INTO roles (id, name) VALUES
        (1, 'root'),
        (2, 'admin'),
        (3, 'customer')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `);
    await this.dataSource.query(`
      SELECT setval(
        pg_get_serial_sequence('roles', 'id'),
        GREATEST((SELECT COALESCE(MAX(id), 1) FROM roles), 1),
        TRUE
      )
    `);

    await this.dataSource.query(`
      INSERT INTO blog_categories (name, slug)
      VALUES ('News', 'news'), ('Events', 'events')
      ON CONFLICT (slug) DO NOTHING
    `);
    await this.dataSource.query(`
      INSERT INTO event_categories (name)
      SELECT category.name
      FROM (VALUES ('Workshop'), ('Seminar'), ('Hackathon')) AS category(name)
      WHERE NOT EXISTS (
        SELECT 1 FROM event_categories existing WHERE existing.name = category.name
      )
    `);
  }
}
