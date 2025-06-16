import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeedService } from "./seed.service";
import { Category } from "../category/category.entity";
import { Attribute } from "../attribute/attribute.entity";
import { CategoryAttribute } from "../category-attribute/category-attribute.entity";
import { CategoryModule } from "../category/category.module";
import { AttributeModule } from "../attribute/attribute.module";
import { CategoryAttributeModule } from "../category-attribute/category-attribute.module";

@Module({
  imports: [
    // Ensure only the direct entities are listed here, no implicit closure table
    TypeOrmModule.forFeature([Category, Attribute, CategoryAttribute]),
    CategoryModule,
    AttributeModule,
    CategoryAttributeModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
