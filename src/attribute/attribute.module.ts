// src/attribute/attribute.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Attribute } from "./attribute.entity";
import { AttributeService } from "./attribute.service";
import { AttributeController } from "./attribute.controller";
import { CategoryModule } from "../category/category.module";
import { CategoryAttributeModule } from "../category-attribute/category-attribute.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Attribute]),
    CategoryModule,
    CategoryAttributeModule,
  ],
  providers: [AttributeService],
  controllers: [AttributeController],
  exports: [TypeOrmModule.forFeature([Attribute]), AttributeService], // <--- FIX HERE TOO
})
export class AttributeModule {}
