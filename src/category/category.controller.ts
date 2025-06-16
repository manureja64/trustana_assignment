import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from "@nestjs/common";
import { UseInterceptors } from "@nestjs/common";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { CategoryService } from "./category.service";
import { Category } from "./category.entity";

@Controller("categories")
@UseInterceptors(CacheInterceptor)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getCategoryTree(
    @Query("includeCounts") includeCounts?: string,
  ): Promise<Category[]> {
    const shouldIncludeCounts = includeCounts === "true";
    return this.categoryService.getCategoryTree(shouldIncludeCounts);
  }

  @Post()
  async createCategory(
    @Body() body: { name: string; parentId?: string },
  ): Promise<Category> {
    return this.categoryService.createCategory(body.name, body.parentId);
  }

  @Put(":id")
  async updateCategory(
    @Param("id") id: string,
    @Body() body: { name?: string; parentId?: string },
  ): Promise<Category> {
    return this.categoryService.updateCategory(id, body.name, body.parentId);
  }

  @Delete(":id")
  async deleteCategory(@Param("id") id: string): Promise<void> {
    return this.categoryService.deleteCategory(id);
  }
}
