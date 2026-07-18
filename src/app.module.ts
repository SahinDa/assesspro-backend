import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import this
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttemptsModule } from './module/attempts/attempts.module';
import { AuthModule } from './module/auth/auth.module';
import { BookmarksModule } from './module/bookmarks/bookmarks.module';
import { LeaderboardModule } from './module/leaderboard/leaderboard.module';
import { NotificationsModule } from './module/notifications/notifications.module';
import { OrganizationsModule } from './module/organizations/organizations.module';
import { SubscriptionModule } from './module/subscriptions/subscription.module';
import { TestModule } from './module/tests/test.module';
import { UserModule } from './module/users/user.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './interceptors/responseinterceptor';
import { AuthGuard } from './guards/authentication.guard';
import { RoleGuard } from './guards/role.guard';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ViolationsModule } from './module/attempts/violations/violations.module';
@Module({
  imports: [
    // 1. Load the .env file globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Setup the Database Connection
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // Auto-creates tables based on your entities
      ssl: {
        rejectUnauthorized: false, // Required for Neon/Remote Postgres
      },
    }),

    // 3. Setup the Global Redis Cache Connection Pool (Upstash)
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: process.env.REDIS_URL,
        isGlobal: true, // 🌟 Makes the Redis instance available everywhere in your app
        options: {
          tls: {}, // Required for secure Upstash connection strings
          connectTimeout: 10000,
        },
      }),
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRETKEY'),
        signOptions: { expiresIn: '1d' },
      }),
    }),

    // 3. FEATURE MODULES (The "Domain")
    AttemptsModule,
    AuthModule,
    BookmarksModule,
    LeaderboardModule,
    NotificationsModule,
    OrganizationsModule,
    SubscriptionModule,
    TestModule,
    UserModule,
    ViolationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
