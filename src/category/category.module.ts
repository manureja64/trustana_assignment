// src/category/category.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "./category.entity";
import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  providers: [CategoryService],
  controllers: [CategoryController],
  exports: [TypeOrmModule.forFeature([Category]), CategoryService], // <--- EXPORT THE CONFIGURED MODULE
})
export class CategoryModule {}
