import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoryAttribute } from "./category-attribute.entity";
import { CategoryAttributeService } from "./category-attribute.service";

@Module({
  imports: [TypeOrmModule.forFeature([CategoryAttribute])],
  providers: [CategoryAttributeService],
  exports: [
    CategoryAttributeService,
    TypeOrmModule.forFeature([CategoryAttribute]),
  ], // Export so it can be used in AttributeModule
})
export class CategoryAttributeModule {}
