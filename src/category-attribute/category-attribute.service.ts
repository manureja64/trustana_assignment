import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategoryAttribute } from "./category-attribute.entity";
import { Attribute } from "../attribute/attribute.entity";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class CategoryAttributeService {
  constructor(
    @InjectRepository(CategoryAttribute)
    private categoryAttributeRepository: Repository<CategoryAttribute>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // Inject CacheManager
  ) {}

  /**
   * Finds direct links (CategoryAttribute entities) by category ID.
   * @param categoryId The ID of the category.
   * @returns An array of CategoryAttribute entities representing direct links.
   */
  async findDirectLinksByCategoryId(
    categoryId: string,
  ): Promise<CategoryAttribute[]> {
    return this.categoryAttributeRepository.find({
      where: { categoryId },
      relations: ["attribute"], // Eagerly load the associated attribute
    });
  }

  /**
   * Finds direct links (CategoryAttribute entities) by attribute ID.
   * @param attributeId The ID of the attribute.
   * @returns An array of CategoryAttribute entities representing direct links.
   */
  async findDirectLinksByAttributeId(
    attributeId: string,
  ): Promise<CategoryAttribute[]> {
    return this.categoryAttributeRepository.find({
      where: { attributeId },
      relations: ["category"], // Eagerly load the associated category
    });
  }

  /**
   * Finds all CategoryAttribute links. Used to determine global attributes.
   * @returns An array of all CategoryAttribute entities.
   */
  async findAllCategoryAttributeLinks(): Promise<CategoryAttribute[]> {
    return this.categoryAttributeRepository.find();
  }

  /**
   * Creates a new direct link between a category and an attribute, and invalidates caches.
   * @param categoryId The ID of the category.
   * @param attributeId The ID of the attribute.
   * @returns The newly created CategoryAttribute link.
   */
  async createDirectLink(
    categoryId: string,
    attributeId: string,
  ): Promise<CategoryAttribute> {
    const existingLink = await this.categoryAttributeRepository.findOne({
      where: { categoryId, attributeId },
    });
    if (existingLink) {
      return existingLink; // Link already exists
    }
    const newLink = this.categoryAttributeRepository.create({
      categoryId,
      attributeId,
    });
    const savedLink = await this.categoryAttributeRepository.save(newLink);
    await this.invalidateAttributeCaches(); // Invalidate attribute caches as link changes affect attribute applicability
    return savedLink;
  }

  /**
   * Deletes a direct link between a category and an attribute, and invalidates caches.
   * @param categoryId The ID of the category.
   * @param attributeId The ID of the attribute.
   * @returns The result of the deletion operation.
   */
  async deleteDirectLink(
    categoryId: string,
    attributeId: string,
  ): Promise<any> {
    const result = await this.categoryAttributeRepository.delete({
      categoryId,
      attributeId,
    });
    if (result.affected && result.affected > 0) {
      await this.invalidateAttributeCaches(); // Invalidate attribute caches as link changes affect attribute applicability
    }
    return result;
  }

  /**
   * Retrieves all attributes directly linked to a given category ID.
   * @param categoryId The ID of the category.
   * @returns A promise resolving to an array of Attribute entities.
   */
  async getDirectlyLinkedAttributes(categoryId: string): Promise<Attribute[]> {
    const categoryAttributes = await this.categoryAttributeRepository.find({
      where: { categoryId },
      relations: ["attribute"],
    });
    return categoryAttributes.map((ca) => ca.attribute);
  }

  /**
   * Invalidates all cached attribute lists.
   * This is a broad reset to ensure consistency when category-attribute links change.
   */
  private async invalidateAttributeCaches(): Promise<void> {
    console.log(
      "Invalidating all attribute related caches due to category-attribute link change...",
    );
    await this.cacheManager.reset(); // Clear all cached API responses for /attributes
  }
}
