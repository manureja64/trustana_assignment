import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, DataSource } from "typeorm";
import { Category } from "./category.entity";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findOne(id: string): Promise<Category | undefined> {
    return this.categoryRepository.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Category[]> {
    return this.categoryRepository.findBy({ id: In(ids) });
  }

  /**
   * Retrieves the full category tree, optionally including direct attribute and product counts.
   * This implementation manually builds the tree structure from flat data.
   * @param includeCounts Whether to include counts of associated direct attributes and products.
   * @returns A promise resolving to an array of root categories with their children.
   */
  async getCategoryTree(includeCounts: boolean = false): Promise<Category[]> {
    const cacheKey = `category_tree_${includeCounts}`;
    const cachedTree = await this.cacheManager.get<Category[]>(cacheKey);

    if (cachedTree) {
      console.log(
        `Serving category tree from cache for includeCounts=${includeCounts}`,
      );
      return cachedTree;
    }

    console.log(
      `Fetching category tree from DB for includeCounts=${includeCounts}`,
    );

    // Fetch all categories with their direct attributes for counting
    const categoriesFlat = await this.categoryRepository.find({
      relations: ["categoryAttributes"], // Eagerly load direct attribute links
      order: { name: "ASC" },
    });

    const categoryMap = new Map<
      string,
      Category & {
        children?: Category[];
        associatedAttributesCount?: number;
        productsCount?: number;
      }
    >();
    categoriesFlat.forEach((cat) => {
      // Initialize counts if requested
      if (includeCounts) {
        (cat as any).associatedAttributesCount =
          cat.categoryAttributes?.length || 0;
        (cat as any).productsCount = Math.floor(Math.random() * 100); // Mock product count
      }
      cat.children = []; // Initialize children array
      categoryMap.set(cat.id, cat as any);
    });

    const rootCategories: Category[] = [];
    categoriesFlat.forEach((cat) => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(cat);
        }
      } else {
        rootCategories.push(cat);
      }
    });

    // Sort children
    categoryMap.forEach((cat) => {
      cat.children.sort((a, b) => a.name.localeCompare(b.name));
    });

    const result = rootCategories;
    await this.cacheManager.set(cacheKey, result, { ttl: 5 * 60 * 1000 });
    return result;
  }

  /**
   * Finds all ancestors of a given category.
   * Implemented with recursive CTE for PostgreSQL.
   * @param categoryId The ID of the category.
   * @returns An array of ancestor categories.
   */
  async getAncestors(categoryId: string): Promise<Category[]> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found.`);
    }

    const query = `
      WITH RECURSIVE ancestors AS (
        SELECT "id", "name", "parentId", "createdAt", "updatedAt"
        FROM categories
        WHERE id = $1
        UNION ALL
        SELECT p."id", p."name", p."parentId", p."createdAt", p."updatedAt"
        FROM categories p
        JOIN ancestors a ON p.id = a."parentId"
      )
      SELECT "id", "name", "parentId", "createdAt", "updatedAt" FROM ancestors WHERE id != $1;
    `;
    const ancestors = await this.categoryRepository.query(query, [categoryId]);
    return ancestors;
  }

  /**
   * Finds all children (descendants) of a given category recursively.
   * Implemented with recursive CTE for PostgreSQL.
   * @param categoryId The ID of the category.
   * @returns An array of descendant categories.
   */
  async getDescendants(categoryId: string): Promise<Category[]> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found.`);
    }

    const query = `
      WITH RECURSIVE descendants AS (
        SELECT "id", "name", "parentId", "createdAt", "updatedAt"
        FROM categories
        WHERE id = $1
        UNION ALL
        SELECT c."id", c."name", c."parentId", c."createdAt", c."updatedAt"
        FROM categories c
        JOIN descendants d ON c."parentId" = d.id
      )
      SELECT "id", "name", "parentId", "createdAt", "updatedAt" FROM descendants WHERE id != $1;
    `;
    const descendants = await this.categoryRepository.query(query, [
      categoryId,
    ]);
    return descendants;
  }

  async createCategory(name: string, parentId?: string): Promise<Category> {
    // const category = new Category();
    const category = await this.categoryRepository.create({ name: name });
    category.name = name;

    if (parentId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: parentId },
      });
      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID ${parentId} not found.`,
        );
      }
      category.parent = parentCategory;
      category.parentId = parentId;
    } else {
      category.parent = null; // Explicitly set parent relation to null for root categories
      category.parentId = null; // Explicitly set parentId to null for root categories
    }

    const newCategory = await this.categoryRepository.save(category);
    await this.invalidateCategoryCaches();
    return newCategory;
  }

  async updateCategory(
    id: string,
    name?: string,
    parentId?: string,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found.`);
    }

    if (name) {
      category.name = name;
    }

    // Handle parent change
    if (parentId !== undefined) {
      if (parentId === null) {
        // Set to root
        category.parent = null;
        category.parentId = null;
      } else {
        const parentCategory = await this.categoryRepository.findOne({
          where: { id: parentId },
        });
        if (!parentCategory) {
          throw new NotFoundException(
            `Parent category with ID ${parentId} not found.`,
          );
        }
        category.parent = parentCategory;
        category.parentId = parentId;
      }
    }

    const updatedCategory = await this.categoryRepository.save(category);
    await this.invalidateCategoryCaches();
    await this.cacheManager.reset();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    // Check if category exists and has children
    const categoryToDelete = await this.categoryRepository.findOne({
      where: { id },
      relations: ["children"], // Load children to check if it's a leaf
    });

    if (!categoryToDelete) {
      throw new NotFoundException(`Category with ID ${id} not found.`);
    }

    if (categoryToDelete.children && categoryToDelete.children.length > 0) {
      throw new Error(
        `Category "${categoryToDelete.name}" has children and cannot be deleted. Delete children first.`,
      );
    }

    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID ${id} not found.`);
    }
    await this.invalidateCategoryCaches();
    await this.cacheManager.reset();
  }

  private async invalidateCategoryCaches(): Promise<void> {
    console.log("Invalidating category tree caches...");
    await this.cacheManager.del("category_tree_true");
    await this.cacheManager.del("category_tree_false");
  }
}
