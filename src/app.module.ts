// src/app.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule, CacheStore } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";

import { Category } from "./category/category.entity";
import { Attribute } from "./attribute/attribute.entity";
import { CategoryAttribute } from "./category-attribute/category-attribute.entity";
import { CategoryModule } from "./category/category.module";
import { AttributeModule } from "./attribute/attribute.module";
import { CategoryAttributeModule } from "./category-attribute/category-attribute.module";
import databaseConfig from "./config/database.config";
import redisConfig from "./config/redis.config";
import { SeedModule } from "./seed/seed.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig],
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // --- ADD THESE LINES FOR DEBUGGING ---
        console.log("-----------------------------------------");
        console.log("Using explicitly listed entities.");
        console.log("Current Working Directory:", process.cwd());
        console.log("NODE_ENV:", process.env.NODE_ENV);
        console.log("-----------------------------------------");
        // --- END DEBUGGING LINES ---

        return {
          type: "postgres",
          host: configService.get<string>("database.host"),
          port: configService.get<number>("database.port"),
          username: configService.get<string>("database.username"),
          password: configService.get<string>("database.password"),
          database: configService.get<string>("database.name"),
          entities: [Category, Attribute, CategoryAttribute],
          synchronize: true,
          logging: "all",
        };
      },
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as unknown as CacheStore,
        host: configService.get<string>("redis.host"),
        port: parseInt(configService.get<string>("redis.port"), 10),
        ttl: configService.get<number>("redis.ttl"),
      }),
      isGlobal: true,
    }),
    CategoryModule,
    AttributeModule,
    CategoryAttributeModule,
    SeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
